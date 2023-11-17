package models

import (
	"errors"
	"fmt"
	"strings"
)

// Direction indicates if a sort operation should be ascending or descending.
type Direction int

// Operator is the FQL operator.
type Operator string

const (
	// EQ equals.
	EQ Operator = ""
	// NEQ not equals.
	NEQ = "!"
	// GT greater than.
	GT = ">"
	// GTE greater than or equal to.
	GTE = ">="
	// LT less than.
	LT = "<"
	// LTE less than or equal to.
	LTE = "<="
	// MATCH match.
	MATCH = "~"
	// NMATCH not match.
	NMATCH = "!~"
)

const (
	// Asc ascending sort.
	Asc Direction = iota
	// Desc descending sort.
	Desc
)

// Filter is an FQL filter request.
type Filter struct {
	// Field is the name of the field on which to filter.
	Field string
	// Value is the value of the filter query.
	Value string
	// Op is the comparison operator.
	Op Operator
}

// NewFQLQuery constructs a new FQL query, and-ing all the filter arguments together.
func NewFQLQuery(filters []Filter) (string, error) {
	if len(filters) == 0 {
		return "", nil
	}
	elems := make([]string, 0, len(filters))
	errs := make([]error, 0, len(filters))
	for i, f := range filters {
		field := strings.TrimSpace(f.Field)
		if field == "" {
			err := fmt.Errorf("filter at index %d has blank field", i)
			errs = append(errs, err)
			continue
		}

		value := strings.TrimSpace(f.Value)
		elem := fmt.Sprintf("%s:%s'%s'", field, f.Op, value)
		elems = append(elems, elem)
	}

	if len(errs) > 0 {
		return "", errors.Join(errs...)
	}
	return strings.Join(elems, "+"), nil
}

// NewFQLSort constructs a new FQL sort string.
func NewFQLSort(field string, direction Direction) (string, error) {
	field = strings.TrimSpace(field)
	if field == "" {
		return "", errors.New("blank field")
	}

	dirS := "asc"
	if direction == Desc {
		dirS = "desc"
	}

	if strings.Contains(field, ".") {
		return fmt.Sprintf("%s|%s", field, dirS), nil
	}
	return fmt.Sprintf("%s.%s", field, dirS), nil
}
