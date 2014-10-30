# reactive-property

> Define reactive properties in your JavaScript objects

## Usage

```js
var person = {
    //define property, with default value,
    //additionally you can pass validation test function
    //as second argument, but that's optional.
    name: reactiveProperty("John", function(value){
        return value !== "";
    })
}

//read property
person.name(); //>>>"John"

//subscribe to property change
person.name.change(function(property, args){
    console.log("Name changed from "+args.old()+" to "+args());
});

//set value
person.name("Ivan");

//reactive properties are being passed by reference
var alias = person.name;

//>>>"Name changed from John to Ivan"

person.name(); //>>>"Ivan"

alias(); //>>>"Ivan"
```

## Aggregate properties
Property aggregating is also supported. Means you can aggregate multiple properties into one.
Reactive property will listen to direct child reactive properties and arrays of properties.
```js
var a = reactiveProperty(1);
var b = reactiveProperty(a); //will listen to a
var c = reactiveProperty([a,b]); //will listen to a & b and fire change when a or b changes.

b.change(function(){
    console.log("B update!");
});

c.change(function(){
    console.log("C update!");
});

a(3); >>> "B update!", "C update!";
```

## Dependency

Reactive property uses [Events library](https://github.com/narushevich/events).