<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use Canvas\Services\Parsedowner;

class ParsedownerTest extends TestCase
{
    private $parsedowner;

    public function setUp()
    {
        parent::setUp();

        $this->parsedowner = new Parsedowner();
    }

    /**
     * Verify converted markdown content of Parsedowner.
     *
     * @test
     * @dataProvider conversionsProvider
     */
    public function it_converts_markdown_to_html($value, $expected)
    {
        $this->assertEquals($expected, $this->parsedowner->toHTML($value));
    }

    /**
     * @return array
     **/
    public static function conversionsProvider()
    {
        return [
            ['Paragraph', '<p>Paragraph</p>'],
            ["Header 1\n=======", '<h1>Header 1</h1>'],
            ['# Header 1', '<h1>Header 1</h1>'],
            ['## Header 2', '<h2>Header 2</h2>'],
            ['### Header 3', '<h3>Header 3</h3>'],
            ['#### Header 4', '<h4>Header 4</h4>'],
            ['##### Header 5', '<h5>Header 5</h5>'],
            ['###### Header 6', '<h6>Header 6</h6>'],
            ['`hello_world`', '<p><code>hello_world</code></p>'],
            ['``` <?php $var = "PHP code blocks"; echo $var; ?> ```', '<p><code>&lt;?php $var = "PHP code blocks"; echo $var; ?&gt;</code></p>'],
            ['*Italics text*', '<p><em>Italics text</em></p>'],
            ['_Italics text_', '<p><em>Italics text</em></p>'],
            ['**Bold text**', '<p><strong>Bold text</strong></p>'],
            ['__Bold text__', '<p><strong>Bold text</strong></p>'],
            ['---', '<hr />'],
            ['***', '<hr />'],
            ['>Note', "<blockquote>\n<p>Note</p>\n</blockquote>"],
            ['[Canvas](https://cnvs.io "Canvas")', '<p><a href="https://cnvs.io" title="Canvas">Canvas</a></p>'],
            ['Intra-word *emp*hasis', '<p>Intra-word <em>emp</em>hasis</p>'],
            ['~~Strikethrough~~', '<p><del>Strikethrough</del></p>'],
            ['![Canvas Logo](https://cnvs.io/img/canvas-logo.gif)', '<p><img src="https://cnvs.io/img/canvas-logo.gif" alt="Canvas Logo" /></p>'],
            ['- List Item', "<ul>\n<li>List Item</li>\n</ul>"],
            ['1. List Item', "<ol>\n<li>List Item</li>\n</ol>"],
            ['[Canvas](https://cnvs.io)', '<p><a href="https://cnvs.io">Canvas</a></p>'],
        ];
    }
}
