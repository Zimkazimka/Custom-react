import {VDomNode} from "./virtual_dom";
import {createDiff, VDomNodeUpdater} from "./diffs";
import {applyUpdate} from "./render";

export abstract class Component<P, S> {
  protected props: P
  protected state: S

  private currentRootNode: VDomNode
  private mountedElement: HTMLElement | Text

  private getUpdateDiff(): VDomNodeUpdater {
    const newRootNode = this.render()
    const diff = createDiff(this.currentRootNode, newRootNode)
    if (diff.kind === 'replace') elem => this.mountedElement = elem
    this.currentRootNode = newRootNode
    setTimeout(() => this.componentDidUpdate())
    return diff
  }

  protected setState(updater: (s:S) => S) {
    if (this.mountedElement === undefined) throw new Error('you are updatetin an unmounted component')
    this.state = updater(this.state)
    applyUpdate(this.mountedElement, this.getUpdateDiff())
  }

  public setProps(props: P): VDomNodeUpdater {
    if (this.mountedElement === null) {
      throw new Error('you are setting the props an unmounted component')
    }
    this.state = this.componentWillRecieveProps(props, this.state)
    this.props = props
    return this.getUpdateDiff()
  }

  public initProps(props: P): VDomNode {
    this.props = props
    this.currentRootNode = this.render()
    return this.currentRootNode
  }

  public notifyMounted(elem: HTMLElement | Text) {
    this.mountedElement = elem
    setTimeout(() => this.componentDidMount())
  }

  public unmount() {
    this.componentWillUnmount()
    this.mountedElement = null
  }

  public componentDidMount() { }
  public componentWillRecieveProps(props: P, state: S): S { return state }
  public componentDidUpdate() { }
  public componentWillUnmount() { }

  public abstract render(): VDomNode
}
