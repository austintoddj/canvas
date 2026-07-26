{{--
  Post body embeds for the optional Canvas UI reader.
  No vendor assets required — works after `php artisan canvas:ui` alone.
--}}
<style>
    /* Images */
    .canvas-post-body img {
        max-width: 100%;
        height: auto;
        border-radius: 0.5rem;
    }

    /* YouTube + video iframes (16:9) */
    .canvas-post-body div[data-youtube-video],
    .canvas-post-body div[data-canvas-iframe][data-layout="video"],
    .canvas-post-body .canvas-post-body-iframe--video {
        position: relative;
        width: 100%;
        max-width: 100%;
        aspect-ratio: 16 / 9;
        margin: 1.25em 0;
        overflow: hidden;
        border-radius: 0.5rem;
        background: #f4f4f5;
    }

    .canvas-post-body div[data-youtube-video] > iframe,
    .canvas-post-body div[data-canvas-iframe][data-layout="video"] > iframe,
    .canvas-post-body .canvas-post-body-iframe--video > iframe {
        position: absolute;
        inset: 0;
        display: block;
        width: 100% !important;
        height: 100% !important;
        border: 0;
    }

    /* X / Twitter cards — width cap; height set by script below */
    .canvas-post-body div[data-canvas-iframe][data-layout="card"],
    .canvas-post-body .canvas-post-body-iframe--card {
        max-width: 550px;
        margin: 1.25em 0;
        overflow: visible;
        background: transparent;
    }

    .canvas-post-body div[data-canvas-iframe][data-layout="card"] > iframe,
    .canvas-post-body .canvas-post-body-iframe--card > iframe {
        display: block;
        width: 100%;
        min-height: 12rem;
        height: 12rem;
        border: 0;
        border-radius: 0.75rem;
    }

    /* Audio */
    .canvas-post-body audio {
        display: block;
        width: 100%;
        max-width: 36rem;
        margin: 1.25em 0;
    }

    /* Prose plugin: don't double-pad media shells */
    .prose.canvas-post-body :where(div[data-youtube-video], div[data-canvas-iframe]) {
        margin-top: 1.25em;
        margin-bottom: 1.25em;
    }
</style>
<script>
(function () {
    var CARD = 'iframe[src*="platform.twitter.com/embed"], iframe[src*="Tweet.html"]';

    function isTwitterOrigin(origin) {
        try {
            var host = new URL(origin).hostname;
            return (
                host === 'twitter.com' ||
                host.endsWith('.twitter.com') ||
                host === 'x.com' ||
                host.endsWith('.x.com') ||
                host.endsWith('.twimg.com')
            );
        } catch (e) {
            return false;
        }
    }

    function coerce(data) {
        if (typeof data !== 'string') return data;
        var t = data.trim();
        if (!t || (t.charAt(0) !== '{' && t.charAt(0) !== '[')) return null;
        try {
            return JSON.parse(t);
        } catch (e) {
            return null;
        }
    }

    function heightFrom(value) {
        if (value == null) return null;
        if (typeof value === 'number') {
            return value >= 1 && value <= 10000 ? Math.ceil(value) : null;
        }
        if (typeof value === 'string' && value.trim() !== '') {
            var n = Number(value);
            return Number.isFinite(n) ? heightFrom(n) : null;
        }
        if (Array.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
                var h = heightFrom(value[i]);
                if (h != null) return h;
            }
            return null;
        }
        if (typeof value === 'object') {
            if ('height' in value) return heightFrom(value.height);
            if ('data' in value) return heightFrom(value.data);
            if ('params' in value) return heightFrom(value.params);
        }
        return null;
    }

    function idFrom(value) {
        if (value == null) return null;
        if (typeof value === 'string' && value.trim()) return value.trim();
        if (typeof value === 'number') return String(value);
        if (Array.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
                var id = idFrom(value[i]);
                if (id) return id;
            }
            return null;
        }
        if (typeof value === 'object') {
            if (value.id != null && (typeof value.id === 'string' || typeof value.id === 'number')) {
                return String(value.id);
            }
            if ('data' in value) return idFrom(value.data);
            if ('params' in value) return idFrom(value.params);
        }
        return null;
    }

    function parseResize(data) {
        var parsed = coerce(data);
        if (parsed == null) return null;

        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
            var embed = parsed['twttr.embed'];
            if (embed && typeof embed === 'object') {
                var method = typeof embed.method === 'string' ? embed.method : '';
                if (method.indexOf('resize') !== -1 || method.indexOf('dimensions') !== -1) {
                    var h = heightFrom(embed.params) || heightFrom(embed);
                    if (h != null) return { height: h, id: idFrom(embed.params) || idFrom(embed) };
                }
            }
            if (typeof parsed.method === 'string' && parsed.method.indexOf('resize') !== -1) {
                var h2 = heightFrom(parsed) || heightFrom(parsed.params);
                if (h2 != null) return { height: h2, id: idFrom(parsed) || idFrom(parsed.params) };
            }
        }

        if (Array.isArray(parsed) && parsed.length >= 2) {
            var head = typeof parsed[0] === 'string' ? parsed[0] : '';
            if (head.indexOf('resize') !== -1 || head.indexOf('twttr') !== -1) {
                var h3 = heightFrom(parsed[1]) || heightFrom(parsed.slice(1));
                if (h3 != null) return { height: h3, id: idFrom(parsed[1]) };
            }
        }

        return null;
    }

    var PLACEHOLDER_PX = 192;

    function atPlaceholder(iframe) {
        var attr = iframe.getAttribute('height');
        if (attr && String(attr).trim() !== '') {
            var n = Number(attr);
            if (isFinite(n)) return n <= PLACEHOLDER_PX;
        }
        var styleH = iframe.style.height;
        if (styleH && String(styleH).trim() !== '') {
            var sn = parseFloat(styleH);
            if (isFinite(sn)) return sn <= PLACEHOLDER_PX;
        }
        return true;
    }

    function findIframe(source, root, widgetId) {
        var list = root.querySelectorAll(CARD);
        if (!list.length) return null;

        if (source) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].contentWindow === source) return list[i];
            }
        }

        if (widgetId) {
            for (var j = 0; j < list.length; j++) {
                if (list[j].id === widgetId || list[j].name === widgetId) return list[j];
            }
        }

        if (list.length === 1) return list[0];

        // Multiple cards: assign in document order to the next still at placeholder height.
        for (var k = 0; k < list.length; k++) {
            if (atPlaceholder(list[k])) return list[k];
        }

        return null;
    }

    function applyHeight(iframe, height) {
        var px = Math.ceil(height) + 'px';
        iframe.style.height = px;
        iframe.style.minHeight = px;
        iframe.setAttribute('height', String(Math.ceil(height)));
    }

    window.addEventListener('message', function (event) {
        if (!isTwitterOrigin(event.origin)) return;
        var notice = parseResize(event.data);
        if (!notice) return;
        var iframe = findIframe(event.source, document, notice.id);
        if (!iframe) return;
        applyHeight(iframe, notice.height);
    });
})();
</script>
