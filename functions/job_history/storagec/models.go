package storagec

// BulkFetchObjectsRequest indicates a desire to fetch a batch of objects.
type BulkFetchObjectsRequest struct {
	// BatchSize is the size of each batch to be fetched.  This is the concurrency.
	BatchSize int
	// Collection is the name of the collection.
	Collection string
	// ObjectKeys identify which objects to fetch.
	ObjectKeys []string
}

type bulkFetchObjectResponse struct {
	object    []byte
	objectKey string
	err       error
}

// BulkFetchObjectsResponse contains the result of a BulkFetch operation.
type BulkFetchObjectsResponse struct {
	// Objects contains the objects returned successfully keyed by object key.
	Objects map[string][]byte
	// Errs contains any errors returned from requests keyed by the object which had the issue.
	Errs map[string]error
}

// FetchObjectRequest is a request to fetch an object.
type FetchObjectRequest struct {
	// Collection is the name of the collection.
	Collection string
	// ObjectKey is the object key.
	ObjectKey string
}

// FetchObjectResponse contains the successful result of a Fetch operation.
type FetchObjectResponse struct {
	// Data is the successfully returned object.
	Data []byte
}

// FetchKeysRequest is a request to fetch a collection of object keys.
type FetchKeysRequest struct {
	// Collection is the name of the collection.
	Collection string
	// Limit is the maximum number of object keys to fetch at a time.
	Limit int
	// StartKey is the offset.
	StartKey string
}

// FetchKeysResponse contains the result of a FetchKeys operation.
type FetchKeysResponse struct {
	// ObjectKeys contains the successfully returned object keys.
	ObjectKeys []string
}

type msaError struct {
	Code    int
	ID      string
	Message string
}

// PutObjectRequest is a request to upload an object into a collection.
type PutObjectRequest struct {
	// Collection is the name of the collection.
	Collection string
	// Data is the object to upload.
	Data []byte
	// ObjectKey is the key.
	ObjectKey string
}

// SearchAndFetchResponse contains the results SearchAndFetch.
type SearchAndFetchResponse struct {
	// Objects is a list of records.
	Objects []SearchAndFetchRecord
	// Offset is the next value to present to the API get back the next page of results.
	Offset int
	// Total is the total number of records which match the filter.
	Total int
}

// SearchAndFetchRecord contains the record of a SearchAndFetch call.
type SearchAndFetchRecord struct {
	// Key is the record's key.
	Key string
	// Data is the serialized version of the record.
	Data []byte
}

// SearchObjectsRequest is a request to locate objects matching the provided filter.
type SearchObjectsRequest struct {
	// Collection is the name of the collection.
	Collection string
	// Filter is the FQL filter.
	Filter string
	// Limit is the maximum number of records to be returned.
	Limit int
	// Offset is the records offset.
	Offset int
	// Sort is the FQL sort string.
	Sort string
}

// SearchObjectsResponse contains the results of the search.
type SearchObjectsResponse struct {
	// ObjectKeys contains the keys of objects which match the search response.
	ObjectKeys []string
	// Offset is the next value to present to the API get back the next page of results.
	Offset int
	// Total is the total number of records which match the filter.
	Total int
}

// StoredObject identifies an object stored in custom storage.
type StoredObject struct {
	// Collection is the name of the collection.
	Collection string
	// ObjectKey is the key of the object.
	ObjectKey string
	// SchemaVersion is the schema version.
	SchemaVersion string
}
