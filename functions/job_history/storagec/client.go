package storagec

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"

	"github.com/crowdstrike/gofalcon/falcon/client/custom_storage"
	"github.com/crowdstrike/gofalcon/falcon/models"
	"github.com/sirupsen/logrus"
)

// NotFound is a dedicated error indicating that the requested object was not found.
var NotFound = errors.New("not found")

// StorageC is a custom storage client interface.
type StorageC interface {
	// BulkFetch returns a multiple objects identified by the given keys in a single call.
	BulkFetch(ctx context.Context, req BulkFetchObjectsRequest) BulkFetchObjectsResponse
	// FetchKeys returns a page of object keys in a collection.
	FetchKeys(ctx context.Context, req FetchKeysRequest) (FetchKeysResponse, error)
	// FetchObject returns a single object identified by the given keys, or an error.
	FetchObject(ctx context.Context, req FetchObjectRequest) (FetchObjectResponse, error)
	// PutObject uploads an object as an array of bytes.
	PutObject(ctx context.Context, req PutObjectRequest) (StoredObject, error)
	// Search fetches object keys which match the given FQL filter.
	Search(ctx context.Context, req SearchObjectsRequest) (SearchObjectsResponse, error)
	// SearchAndFetch combines Search and BulkFetch into a single function, returning the records
	// discovered through Search.
	SearchAndFetch(ctx context.Context, req SearchObjectsRequest) (SearchAndFetchResponse, error)
}

// Client is the client object.
type Client struct {
	accessToken string
	c           custom_storage.ClientService
	hc          *http.Client
	logger      logrus.FieldLogger
}

var _ StorageC = (*Client)(nil)

// NewClient returns a new and initialized instance of a Client.
func NewClient(c custom_storage.ClientService, hc *http.Client, accessToken string, logger logrus.FieldLogger) *Client {
	return &Client{
		accessToken: accessToken,
		c:           c,
		hc:          hc,
		logger:      logger,
	}
}

func (f *Client) BulkFetch(ctx context.Context, req BulkFetchObjectsRequest) BulkFetchObjectsResponse {
	batches := make([][]string, 0)
	batchSize := 20
	if req.BatchSize > 0 {
		batchSize = req.BatchSize
	}
	for i := 0; i < len(req.ObjectKeys); i += batchSize {
		endIndex := i + batchSize
		if endIndex >= len(req.ObjectKeys) {
			endIndex = len(req.ObjectKeys)
		}
		batches = append(batches, req.ObjectKeys[i:endIndex])
	}

	results := BulkFetchObjectsResponse{
		Errs:    make(map[string]error),
		Objects: make(map[string][]byte),
	}
	for _, batch := range batches {
		var wg sync.WaitGroup
		ch := make(chan bulkFetchObjectResponse, len(batch))
		for _, b := range batch {
			wg.Add(1)
			go func(ctx0 context.Context, objectKey string, breq BulkFetchObjectsRequest, ch chan bulkFetchObjectResponse) {
				defer wg.Done()
				r := FetchObjectRequest{
					Collection: breq.Collection,
					ObjectKey:  objectKey,
				}
				resp, err := f.FetchObject(ctx0, r)
				ch <- bulkFetchObjectResponse{objectKey: objectKey, object: resp.Data, err: err}
			}(context.WithValue(ctx, "objectKey", b), b, req, ch)
		}
		wg.Wait()
		close(ch)

		for br := range ch {
			if br.err == nil {
				results.Objects[br.objectKey] = br.object
			} else {
				results.Errs[br.objectKey] = br.err
			}
		}
	}

	return results
}

func (f *Client) FetchObject(ctx context.Context, req FetchObjectRequest) (FetchObjectResponse, error) {
	params := custom_storage.GetObjectParams{
		Context:        ctx,
		CollectionName: req.Collection,
		ObjectKey:      req.ObjectKey,
	}

	f.logger.WithField("object_key", params.ObjectKey).
		WithField("collection", params.CollectionName).
		Printf("fetching")
	buf := new(bytes.Buffer)
	resp, err := f.c.GetObject(&params, buf)
	if resp != nil && resp.IsCode(http.StatusNotFound) {
		return FetchObjectResponse{}, NotFound
	}
	// hack to get around limitation of the gofalcon client
	if err != nil && strings.Contains(strings.ToLower(err.Error()), "status 404") {
		return FetchObjectResponse{}, NotFound
	}
	if err != nil {
		return FetchObjectResponse{}, err
	}

	data, err := io.ReadAll(buf)
	if err != nil {
		return FetchObjectResponse{}, err
	}
	if len(data) == 0 {
		return FetchObjectResponse{}, nil
	}
	return FetchObjectResponse{Data: data}, nil
}

func (f *Client) PutObject(ctx context.Context, req PutObjectRequest) (StoredObject, error) {
	reader := io.NopCloser(bytes.NewReader(req.Data))
	params := custom_storage.PutObjectParams{
		Context:        ctx,
		CollectionName: req.Collection,
		ObjectKey:      req.ObjectKey,
		Body:           reader,
	}
	resp, err := f.c.PutObject(&params)
	if err != nil {
		return StoredObject{}, err
	}
	if resp.IsCode(http.StatusNotFound) {
		return StoredObject{}, NotFound
	}

	payload := resp.Payload
	if payload == nil {
		return StoredObject{}, errors.New("missing payload")
	}

	if len(payload.Errors) > 0 {
		err = fmt.Errorf("errors returned from request: %s", joinMsaAPIErrors(payload.Errors))
		return StoredObject{}, err
	}

	res := payload.Resources
	if len(res) == 0 {
		return StoredObject{}, errors.New("blank resources returned")
	}
	return StoredObject{
		Collection:    asString(res[0].CollectionName),
		ObjectKey:     asString(res[0].ObjectKey),
		SchemaVersion: asString(res[0].SchemaVersion),
	}, nil
}

func (f *Client) FetchKeys(ctx context.Context, req FetchKeysRequest) (FetchKeysResponse, error) {
	params := custom_storage.ListObjectsParams{
		Context:        ctx,
		CollectionName: req.Collection,
		Limit:          int64(req.Limit),
		Start:          req.StartKey,
	}
	resp, err := f.c.ListObjects(&params)
	if err != nil {
		return FetchKeysResponse{}, err
	}
	if resp.IsCode(http.StatusNotFound) {
		return FetchKeysResponse{}, NotFound
	}
	payload := resp.Payload
	if payload == nil {
		return FetchKeysResponse{}, errors.New("missing payload")
	}

	if len(payload.Errors) > 0 {
		err = fmt.Errorf("errors returned from request: %s", joinMsaAPIErrors(payload.Errors))
		return FetchKeysResponse{}, err
	}

	res := payload.Resources
	if len(res) == 0 {
		return FetchKeysResponse{}, nil
	}
	return FetchKeysResponse{ObjectKeys: res}, nil
}

func (f *Client) Search(ctx context.Context, req SearchObjectsRequest) (SearchObjectsResponse, error) {
	limit := 100
	if req.Limit > 0 {
		limit = req.Limit
	}
	var sort *string
	if req.Sort != "" {
		sort = &req.Sort
	}
	offset := 0
	if req.Offset > 0 {
		offset = req.Offset
	}
	params := custom_storage.SearchObjectsParams{
		CollectionName: req.Collection,
		Context:        ctx,
		Filter:         req.Filter,
		Limit:          int64(limit),
		Offset:         int64(offset),
		Sort:           sort,
	}
	resp, err := f.c.SearchObjects(&params)
	if err != nil {
		return SearchObjectsResponse{}, err
	}
	if resp.IsCode(http.StatusNotFound) {
		return SearchObjectsResponse{}, NotFound
	}
	payload := resp.Payload
	if payload == nil {
		return SearchObjectsResponse{}, errors.New("missing payload")
	}

	if len(payload.Errors) > 0 {
		err = fmt.Errorf("errors returned from request: %s", joinMsaAPIErrors(payload.Errors))
		return SearchObjectsResponse{}, err
	}

	sor := SearchObjectsResponse{}
	if pagination := payload.Meta.Pagination; pagination != nil {
		sor.Total = int(pagination.Total)
		sor.Offset = int(pagination.Offset)
	}
	res := payload.Resources
	if len(res) == 0 {
		return sor, nil
	}
	sor.ObjectKeys = make([]string, len(res))
	for i, r := range res {
		sor.ObjectKeys[i] = asString(r.ObjectKey)
	}
	return sor, nil
}

func (f *Client) SearchAndFetch(ctx context.Context, req SearchObjectsRequest) (SearchAndFetchResponse, error) {
	searchResp, err := f.Search(ctx, req)
	if err != nil {
		err = fmt.Errorf("error returned from search operation: %s", err)
		return SearchAndFetchResponse{}, err
	}
	if len(searchResp.ObjectKeys) == 0 {
		return SearchAndFetchResponse{}, nil
	}
	bulkReq := BulkFetchObjectsRequest{
		Collection: req.Collection,
		ObjectKeys: searchResp.ObjectKeys,
	}
	bulkResp := f.BulkFetch(ctx, bulkReq)
	if len(bulkResp.Errs) > 0 {
		var sb strings.Builder
		sb.WriteString("errors returned from bulk fetch operation:")
		for k, e := range bulkResp.Errs {
			sb.WriteString(fmt.Sprintf("\n[%s] %s", k, e.Error()))
		}
		return SearchAndFetchResponse{}, errors.New(sb.String())
	}
	resp := SearchAndFetchResponse{
		Objects: make([]SearchAndFetchRecord, 0, len(bulkResp.Objects)),
		Offset:  searchResp.Offset,
		Total:   searchResp.Total,
	}
	notFound := make([]string, 0)
	for _, k := range searchResp.ObjectKeys {
		o, ok := bulkResp.Objects[k]
		if !ok {
			notFound = append(notFound, k)
			continue
		}
		resp.Objects = append(resp.Objects, SearchAndFetchRecord{
			Key:  k,
			Data: o,
		})
	}
	if len(notFound) > 0 {
		err = fmt.Errorf("key returned from search but not from bulk fetch: %s", strings.Join(notFound, ", "))
		return resp, err
	}
	return resp, nil
}

func joinMsaAPIErrors(errs []*models.MsaAPIError) error {
	if len(errs) == 0 {
		return nil
	}
	var sb strings.Builder
	for i, err := range errs {
		if i == 0 {
			sb.WriteString("\n")
		}
		sb.WriteString(fmt.Sprintf("[%d] %s", err.Code, asString(err.Message)))
	}
	return errors.New(sb.String())
}

func asString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
