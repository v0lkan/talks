/*
 © Nathanael Anderson.
 https://github.com/Nathanaela/v8-Natives
 v8-Natives is under The MIT License (MIT)
 */

var v8 = require('v8-natives');

// Make it easy to access these functions
var printStatus = v8.helpers.printStatus;
var testOptimization = v8.helpers.testOptimization;
var benchmark = v8.helpers.benchmark;


if (!v8.isNative()) {
    console.log("You must run this with the --allow-natives-syntax command line.");
    process.exit(0);
}

console.log("Node is using v8 version:", v8.getV8Version(), "\r\n");


function sum(a, b, c) {
    var result = 0;
    for (var i = 0; i < arguments.length; i++) {
        result += arguments[i];
    }
    return result;
}

function sum1() {
    sum(1, 2, 3);
}

function sum2() {
    sum.call(this, 1, 2, 3);
    sum.apply(this, [1, 2, 3]);
}

// Leaking Arguments
function sum3(a) {
    sum.call(this, arguments);
    sum.apply(this, arguments);
    sum(arguments);
}

function sum4() {
    for (var i= 0,args =[];i<arguments.length;i++) args[i] = arguments[i];
    sum(args);
    sum.call(this, args);
    sum.apply(this, args);
}

// Using or Setting Arguments improperly (even if you don't use them afterwords) will cause it to be un-optimizable
function sum6(a) {
    //var _arguments = arguments;
    arguments[1] = 1;
}

function sum5() {
    sum6([1,2,3]);
}

console.log("Simple Routine can be optimized");
testOptimization(sum1);

console.log("\r\nApply/Call can be optimized");
testOptimization(sum2);

console.log("\r\nApply/Call with 'arguments' is not optimizable");
testOptimization(sum3);

console.log("\r\nCopying args, and then using call/apply is optimizable");
testOptimization(sum4);

console.log("\r\nSum5 should optimize, sum6 won't since it is writing back to arguments.");
testOptimization([sum5,sum6], ['sum5','sum6']);

var cnt = 1000000;
var time = benchmark(cnt, sum1);
//var time = benchmark(cnt, sum1);

console.log("\r\n\r\nRunning a Simple benchmark", cnt, "iterations in", time, "nanoseconds", time/cnt, "each");