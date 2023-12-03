import jm from 'crypto-js';

/**
 * 
 * @param {string} code 加密前的值
 * @returns {string}
 */
function sha266(code) {
    var now = jm.SHA512(code).toString();
    for (var p = 0; p < 266; p++) {

        now = now + jm.SHA512(now).toString();
    }
    return now;
}

export { sha266 }