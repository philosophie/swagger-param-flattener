import { cloneDeep } from 'lodash-es'

import { WalkerState } from './interfaces'

/**
 * functions to walk an OpenAPI schema object and traverse all subschemas
 * calling a callback function on each one
 */

/**
 * obtains the default starting state for the `state` object used
 * by walkSchema
 * @return the state object suitable for use in walkSchema
 */
export function getDefaultState() {
  return {
    depth: 0,
    seen: new WeakMap(),
    top: true,
    combine: false
  } as WalkerState
}

/**
 * begins the walk of a schema object, or the `state` object used
 * by walkSchema
 * @param parent the parent schema, if any. Use empty object if none
 * @param state the initial starting state of the walker, usually obtained from `getDefaultState`
 * @param callback, a function taking a schema, parent and state to be called on this and all subschemas
 * @return the schema object
 */
export function walkSchema(schema: any, parent: any, state: WalkerState, callback: any) {
  if (typeof state.depth === 'undefined') state = getDefaultState()
  if (schema === null || typeof schema === 'undefined') return schema
  schema = cloneDeep(schema)

  if (state.combine) {
    if (schema.allOf && Array.isArray(schema.allOf) && schema.allOf.length === 1) {
      schema = Object.assign({}, schema.allOf[0], schema)
      delete schema.allOf
    }
    if (schema.anyOf && Array.isArray(schema.anyOf) && schema.anyOf.length === 1) {
      schema = Object.assign({}, schema.anyOf[0], schema)
      delete schema.anyOf
    }
    if (schema.oneOf && Array.isArray(schema.oneOf) && schema.oneOf.length === 1) {
      schema = Object.assign({}, schema.oneOf[0], schema)
      delete schema.oneOf
    }
  }

  callback(schema, parent, state)
  if (state.seen.has(schema)) {
    return schema
  }
  //else
  if (typeof schema === 'object' && schema !== null) state.seen.set(schema, true)
  state.top = false
  state.depth++

  if (typeof schema.items !== 'undefined') {
    state.property = 'items'
    walkSchema(schema.items, schema, state, callback)
  }
  if (schema.additionalItems) {
    if (typeof schema.additionalItems === 'object') {
      state.property = 'additionalItems'
      walkSchema(schema.additionalItems, schema, state, callback)
    }
  }
  if (schema.additionalProperties) {
    if (typeof schema.additionalProperties === 'object') {
      state.property = 'additionalProperties'
      walkSchema(schema.additionalProperties, schema, state, callback)
    }
  }
  if (schema.properties) {
    for (let prop in schema.properties) {
      let subSchema = schema.properties[prop]
      state.property = 'properties/' + prop
      walkSchema(subSchema, schema, state, callback)
    }
  }
  if (schema.patternProperties) {
    for (let prop in schema.patternProperties) {
      let subSchema = schema.patternProperties[prop]
      state.property = 'patternProperties/' + prop
      walkSchema(subSchema, schema, state, callback)
    }
  }
  if (schema.allOf) {
    for (let index in schema.allOf) {
      let subSchema = schema.allOf[index]
      state.property = 'allOf/' + index
      walkSchema(subSchema, schema, state, callback)
    }
  }
  if (schema.anyOf) {
    for (let index in schema.anyOf) {
      let subSchema = schema.anyOf[index]
      state.property = 'anyOf/' + index
      walkSchema(subSchema, schema, state, callback)
    }
  }
  if (schema.oneOf) {
    for (let index in schema.oneOf) {
      let subSchema = schema.oneOf[index]
      state.property = 'oneOf/' + index
      walkSchema(subSchema, schema, state, callback)
    }
  }
  if (schema.not) {
    state.property = 'not'
    walkSchema(schema.not, schema, state, callback)
  }
  state.depth--
  return schema
}
