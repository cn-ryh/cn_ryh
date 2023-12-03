/**
 * 转换 Markdown 到 html
 * @param {string} code 要转换的文本
 * @returns {string} 转换结果，局部 HTML 代码
 */
// import aaa from 'markdown-it-mathjax-chtml'
// import mathjax from "markdown-it-mathjax-chtml"
import MarkdownIt from "markdown-it";
import math from "markdown-it-mathjax3"
import highlight from "highlight.js"
function MarkDown2HTML(code) {
    const render = MarkdownIt({
        highlight: function (str, lang) {
            if(!lang)
            {
                lang = `cmd`
            }
            if (lang && highlight.getLanguage(lang)) {
                try {
                    return '<pre class="hljs"><code>' +
                        highlight.highlight(str,{language:lang,ignoreIllegals:true}).value +
                        '</code></pre>';
                } catch (__) { }
            }
        }
    }).use(math)
    return render.render(code)
}
export { MarkDown2HTML }