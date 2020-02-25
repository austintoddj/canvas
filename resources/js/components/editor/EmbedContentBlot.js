import Quill from 'quill'

let BlockEmbed = Quill.import('blots/block/embed')

class EmbedContentBlot extends BlockEmbed {
    static create(value) {
        let node = super.create()

        node.innerHTML = value.content
        node.setAttribute('contenteditable', false)

        return node
    }

    static value(node) {
        return {
            content: node.innerHTML,
        }
    }
}

EmbedContentBlot.tagName = 'div'
EmbedContentBlot.blotName = 'embed-content'
EmbedContentBlot.className = 'ql-embed-content'

export default EmbedContentBlot
