window.Caller = {
    callMeMaybe: function () {
        var self = this;

        var id = setTimeout(function () {
            console.log('Hi there!');

            self.callMeMaybe();
        }, 1000);

        return id;
    }
};

/*id =*/ window.Caller.callMeMaybe();

window.Caller = null; // will still leak.

delete window.Caller; // ditto!

//clearTimeout(id);