import {VDOMAttributes, VDomNode} from "./virtual_dom";

type AttributesUpdater = {
  set: VDOMAttributes
  remove: string[]
}

interface UpdateOperation {
  kind: 'update'
  attributes: AttributesUpdater
  children: ChildUpdater[]
}

interface ReplaceOperation {
  kind: 'replace'
  newNode: VDomNode
  callback?: (elem: HTMLElement | Text) => void
}

interface SkipOperation {
  kind: 'skip'
}

export type VDomNodeUpdater = UpdateOperation | ReplaceOperation | SkipOperation

interface RemoveOperation {
  kind: 'remove'
}

interface InsertOperation {
  kind: 'insert'
  node: VDomNode
}

export type ChildUpdater = UpdateOperation | ReplaceOperation | RemoveOperation | SkipOperation | InsertOperation

const skip = (): SkipOperation => ({kind: "skip"})

const replace = (newNode: VDomNode): ReplaceOperation => ({kind: "replace", newNode})

const update = (attributes: AttributesUpdater, children: ChildUpdater[]): UpdateOperation => ({
  kind: "update",
  attributes,
  children
})

const remove = (): RemoveOperation => ({kind: 'remove'})

const insert = (node: VDomNode): InsertOperation => ({kind: "insert", node})

export const createDiff = (oldNode: VDomNode, newNode: VDomNode): VDomNodeUpdater => {
  if (oldNode.kind === 'text' && newNode.kind === 'text' && oldNode.value === newNode.value) {
    return skip()
  }

  if (oldNode.kind === 'text' || newNode.kind === 'text') {
    return replace(newNode)
  }

  if (oldNode.kind === 'component') {
    oldNode.instance.unmount()
    oldNode.instance = null
    return replace(newNode)
  }

  if (newNode.kind === 'component') {
    newNode.instance = new newNode.component()
    return {
      kind: 'replace',
      newNode: newNode.instance.initProps(newNode.props),
      callback: e => newNode.instance.notifyMounted(e)
    }
  }

  if (oldNode.tagname !== newNode.tagname) {
    return replace(newNode)
  }

  const attUpdater: AttributesUpdater = {
    remove: Object.keys(oldNode.props || {})
      .filter(att => Object.keys(newNode).indexOf(att) !== -1),
    set: Object.keys(newNode.props || {})
      .filter(att => oldNode.props[att] !== newNode.props[att])
      .reduce((upd, att) => ({...upd, [att]: newNode.props[att]}), {})
  }

  const childsUpdater: ChildUpdater[] = childsDiff((oldNode.children || []), (newNode.children || []))

  return update(attUpdater, childsUpdater)
}

const childsDiff = (oldChilds: VDomNode[], newChilds: VDomNode[]): ChildUpdater[] => {
  const remainingOldChilds: [string | number, VDomNode][] = oldChilds.map(c => [c.key, c])
  const remainingNewChilds: [string | number, VDomNode][] = newChilds.map(c => [c.key, c])

  const operations: ChildUpdater[] = []

  let [ nextUpdateKey ] = remainingOldChilds.find(k => remainingNewChilds.map(k => k[0]).indexOf(k[0]) != -1) || [null]

  const removeUntilKey = (operations: ChildUpdater[], elems: [string | number, VDomNode][], key: string | number) => {
    while (elems[0] && elems[0][0] !== key) {
      if (elems[0][1].kind === 'component') {
        elems[0][1].instance.unmount()
        elems[0][1].instance = null
      }
      operations.push(remove())
      elems.shift()
    }
  }

  const insertUtilKey = (operations: ChildUpdater[], elems: [string | number, VDomNode][], key: string | number) => {
    while (elems[0] && elems[0][0] !== key) {
      operations.push(insert(elems.shift()[1]))
    }
  }

  while (nextUpdateKey) {

    removeUntilKey(operations, remainingOldChilds, nextUpdateKey)

    insertUtilKey(operations, remainingNewChilds, nextUpdateKey)

    operations.push(createDiff(remainingOldChilds.shift()[1], remainingNewChilds.shift()[1]))

    [ nextUpdateKey ] = remainingOldChilds.find(k => remainingNewChilds.map(k => k[0]).indexOf(k[0]) != -1) || [null]
  }

  removeUntilKey(operations, remainingOldChilds, undefined)

  insertUtilKey(operations, remainingNewChilds, undefined)

  return operations
}
