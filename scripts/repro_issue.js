
const sortedBooks = ['יוחנן ג', 'יוחנן ב', 'יוחנן א', 'יוחנן']; // Sorted by length

const reference = "יוחנן ג:טז";
console.log(`Testing reference: "${reference}"`);

function parse(cleanRef) {
    for (const book of sortedBooks) {
        if (cleanRef.startsWith(book)) {
            console.log(`Matched book: "${book}"`);
            const remainder = cleanRef.slice(book.length).trim();
            console.log(`Remainder: "${remainder}"`);

            const parts = remainder.match(/^([א-ת"']+)(?:[\s:]+([א-ת"']+)(?:[\s\-]+([א-ת"']+))?)?$/);
            
            if (parts) {
                console.log("Parsing SUCCESS");
                console.log("Chapter:", parts[1]);
                console.log("Verse:", parts[2]);
                return;
            } else {
                console.log("Parsing FAILED for this book match.");
                // Current logic BREAKS here
                break;
            }
        }
    }
    console.log("Final Result: Could not parse reference.");
}

parse(reference);
