import Quill from 'quill'

let BlockEmbed = Quill.import('blots/block/embed')

class DividerBlot extends BlockEmbed {
    //
}

DividerBlot.blotName = 'divider'
DividerBlot.tagName = 'hr'

export default DividerBlot
