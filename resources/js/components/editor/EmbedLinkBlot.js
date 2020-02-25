import Quill from 'quill'
import Url from 'url-parse'

let BlockEmbed = Quill.import('blots/block/embed');

/**
 * Supported embeddable link types:
 *      Twitter
 *      Transistor
 */
class EmbedLinkBlot extends BlockEmbed {
    static create(value) {
        let node = super.create();

        let url = new Url(value);
        let id = url.pathname.substr(url.pathname.lastIndexOf('/') + 1);

        node.dataset.url = url;
        node.dataset.id = id;

        switch (true) {
            case url.host.includes('twitter'):
                twttr.widgets.createTweet(id, node, {
                    theme: !Canvas.darkMode ? 'light': 'dark'
                });

                node.setAttribute('class', 'ql-tweet');

                break;
            case url.host.includes('transistor'):
                let iframe = document.createElement('iframe');

                // You can append /light or /dark to the src attribute
                iframe.setAttribute('src', '//share.transistor.fm/e/' + id);
                iframe.setAttribute('height', '180');
                iframe.setAttribute('width', '100%');
                iframe.setAttribute('frameborder', 0);
                iframe.setAttribute('scrolling', 'no');
                iframe.setAttribute('seamless', 'true');

                node.appendChild(iframe);

                break;
            default:
                let nodeDefault = document.createElement('p');
                let textDeafult = document.createTextNode(url.href);

                nodeDefault.appendChild(textDeafult)
                node.appendChild(nodeDefault)
        }

        return node;
    }

    static value(domNode) {
        return domNode.dataset.url;
    }
}

EmbedLinkBlot.tagName = 'div';
EmbedLinkBlot.blotName = 'embed-link';

export default EmbedLinkBlot
