import {Component} from "./component";
import {createComponent, createElement, createText, VDomNode} from "./virtual_dom";

interface NewItemFormState {
  name: string
}

interface NewItemFormProps {
  addItem: (name: string) => void
}

class NewItemForm extends Component<NewItemFormProps, NewItemFormState> {
  state = { name: '' }

  render(): VDomNode {
    return createElement(
      'form',
      {
        key: 'form',
        onSubmit: (e: Event) => {
          e.preventDefault()
          this.props.addItem(this.state.name)
          this.setState(() => ({ name: '' }))
        }
      },
      createElement('label', { key: 'l-n', 'for': 'i-n' }, createText('New Item')),
      createElement('input', {
        key: 'i-n', id: 'i-n',
        value: this.state.name,
        oninput: (e: any) => this.setState(s => ({ ...s, name: e.target.value }))
      })
    );
  }
}

interface ToDoItem {
  name: string
  done: boolean
}

interface ToDoState {
  items: ToDoItem[]
}

class ToDoComponent extends Component<{}, ToDoState> {
  state: ToDoState = { items: [] }

  toggleItem(index: number) {
    this.setState(s => ({items: s.items.map((item, i) => {
      if (index === 1) return { ...item, done: !item.done }
      return item
      })}))
  }

  render() {
    return createElement('div', { key: 'root' },
      createComponent(NewItemForm, {
        key: 'form',
        addItem: n => this.setState(s => ({items: s.items.concat([{name: n, done: false}])}))
      }),
      createElement('ul', { key: 'items' },
        ...this.state.items.map((item: ToDoItem, i) =>
          createElement('li', { key: i.toString() },
            createElement('button', {
              key: 'button',
              onclick: () => this.toggleItem(i)
            },
              createText(item.done ? 'done' : '-')
              ),
            createText(item.name, 'label')
            )
        )
        )
      )
  }
}
