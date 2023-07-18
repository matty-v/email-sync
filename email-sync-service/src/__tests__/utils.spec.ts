import { describe, expect, test } from '@jest/globals';
import { format } from 'prettier';
import { decode, encode, fixHrefs, replaceMdImgsWithLinks, stripStyleTagsFromHtml } from '../utils/utils';

const formatStmt = (str: string, parser?: string) => format(str, { parser: parser ?? 'html' });

const testEncodedHtml = `PGRpdiBkaXI9Imx0ciI-PGZvbnQgc2l6ZT0iNCI-SGVsbG8hPC9mb250PjxkaXY-PGk-VGhpczwvaT7CoGlzIGHCoDxiPnRlc3Q8L2I-wqA8dT5lbWFpbDwvdT4uPC9kaXY-PGRpdj48dWw-PGxpIHN0eWxlPSJtYXJnaW4tbGVmdDoxNXB4Ij5JdGVtIDE8L2xpPjxsaSBzdHlsZT0ibWFyZ2luLWxlZnQ6MTVweCI-SXRlbSAyPC9saT48bGkgc3R5bGU9Im1hcmdpbi1sZWZ0OjE1cHgiPkl0ZW0gMzwvbGk-PC91bD48ZGl2PkxldCYjMzk7cyBoYXZlIHNvbWUgJnF1b3Q7dGV4dCZxdW90OyB3aXRoIHNwZWNpYWwgY2hhcnMgJmFtcDsgc3R1ZmYgLSAxMDAlIPCfmIo8L2Rpdj48ZGl2Pjxicj48L2Rpdj48ZGl2PjxhIGhyZWY9Imh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vIiB0YXJnZXQ9Il9ibGFuayI-R29vZ2xlIExpbms8L2E-PC9kaXY-PC9kaXY-PGRpdj48YnI-PC9kaXY-PGRpdj48aW1nIHNyYz0iY2lkOmlpX2xqdDNlNWV4MSIgYWx0PSJidXJyaXRvLWRvZy5wbmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBjbGFzcz0iZ21haWwtQ1RvV1VkIj48L2Rpdj48L2Rpdj4NCg==`;
const testDecodedHtml = `<div dir="ltr"><font size="4">Hello!</font><div><i>This</i> is a <b>test</b> <u>email</u>.</div><div><ul><li style="margin-left:15px">Item 1</li><li style="margin-left:15px">Item 2</li><li style="margin-left:15px">Item 3</li></ul><div>Let&#39;s have some &quot;text&quot; with special chars &amp; stuff - 100% 😊</div><div><br></div><div><a href="https://www.google.com/" target="_blank">Google Link</a></div></div><div><br></div><div><img src="cid:ii_ljt3e5ex1" alt="burrito-dog.png" width="128" height="128" class="gmail-CToWUd"></div></div>`;

describe('Encode/Decode HTML', () => {
  test('correctly decodes text/html', () => {
    const decodedHtml = decode(testEncodedHtml);
    expect(formatStmt(decodedHtml)).toStrictEqual(formatStmt(testDecodedHtml));
  });

  test('correctly encodes and re-decodes text/html', () => {
    const encodedHtml = encode(testDecodedHtml);
    const reDecodedHtml = decode(encodedHtml);
    expect(formatStmt(reDecodedHtml)).toStrictEqual(formatStmt(testDecodedHtml));
  });
});

describe('Fix Hrefs', () => {
  test('adds quotes to href tags in html', () => {
    const htmlWithBadHrefs = `<a href=https://www.google.com/abc-123_hello style="color: #166BDA;">Google</a>`;
    const fixedHrefs = fixHrefs(htmlWithBadHrefs);
    expect(fixedHrefs).toBe(`<a href="https://www.google.com/abc-123_hello" style="color: #166BDA;">Google</a>`);
  });

  test('adds quotes to href tags - url at the end', () => {
    const htmlWithBadHrefs = `<a style="color: #166BDA;" href=https://www.google.com/abc-123_hello>Google</a>`;
    const fixedHrefs = fixHrefs(htmlWithBadHrefs);
    expect(fixedHrefs).toBe(`<a style="color: #166BDA;" href="https://www.google.com/abc-123_hello">Google</a>`);
  });

  test('ignores correct href tags', () => {
    const htmlWithGoodHrefs = `<a href="https://www.google.com/abc-123_hello" style="color: #166BDA;">Google</a>`;
    const fixedHrefs = fixHrefs(htmlWithGoodHrefs);
    expect(fixedHrefs).toBe(`<a href="https://www.google.com/abc-123_hello" style="color: #166BDA;">Google</a>`);
  });
});

describe('Clean up HTML entities', () => {
  test('can replace html entities in text', () => {});
});

describe('Replace images with links in markdown', () => {
  test('removes any image style links', () => {
    const markdown = 'This is some ![embedded.png](https://some.url) embedded image ![link](http://some.other.url)';

    const editedMarkdown = replaceMdImgsWithLinks(markdown);

    expect(editedMarkdown).toBe(
      'This is some [embedded.png](https://some.url) embedded image [link](http://some.other.url)',
    );
  });

  test('leaves non-image links undisturbed', () => {
    const markdown = 'This is some [embedded.png](https://some.url) link, [hello](http://some.other.url)';

    const editedMarkdown = replaceMdImgsWithLinks(markdown);

    expect(editedMarkdown).toBe('This is some [embedded.png](https://some.url) link, [hello](http://some.other.url)');
  });
});

describe('Removes Style Tags From HTML', () => {
  test('removes the style tags and leaves everything else', () => {
    const html = 'hello<style type="text/css">.blockTitle {font-family: sans-serif;font-size:12px;}</style> goodbye';
    const editedHtml = stripStyleTagsFromHtml(html);
    expect(editedHtml).toBe('hello goodbye');
  });
});

describe('Markdownify', () => {
  test('can convert html to markdown', () => {
    // const html = createSampleHtml();
    // console.log(markdownify(html));
  });
});
