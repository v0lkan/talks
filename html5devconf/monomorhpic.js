function kickAss() {}

function Banana(state, apples, oranges) {
    if (state) {
        this.apples = apples;
        this.oranges = oranges;
    } else {

        // Warning: initialization order swapped!
        this.oranges = oranges;
        this.apples = apples;
    }
}

var banana1 = new Banana(true, 10, 20);
var banana2 = new Banana(false, 10, 20);



function evaluateThings(apples, oranges) {
    kickAss(apples, oranges);
}

evaluateThings("hello", "world");

// This is a polymorphic call; avoid it.
evaluateThings(42, 64);



