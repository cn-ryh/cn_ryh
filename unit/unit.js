function translateFileSize(nowSize) {
    let k = nowSize;
    const sizes = [`B`, `KB`, `MB`, `GB`]
    let now = 0;
    while (k > 1024 && now < 3) {
        k = (k / 1024).toFixed(2);
        now++;
    }
    return `${k} ${sizes[now]}`;
}
export { translateFileSize }