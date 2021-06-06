
var natural = require('natural');

var corpus = ['idiot'];
var spellcheck = new natural.Spellcheck(corpus);

const main = () => {
    try {
        console.log(spellcheck.getCorrections('indian', 3)); 
        console.log(spellcheck.getCorrections('इंडियन', 2));
    } catch(err) {
        console.log(err)
    }
}

main();