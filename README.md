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
person.name.on(function(property, args){
    console.log("Now name is "+args.newValue);
});

//set value
person.name("Ivan");

//reactive properties are being passed by reference
var alias = person.name;

//>>>"Now name is Ivan"

person.name(); //>>>"Ivan"

alias(); //>>>"Ivan"
```

## Nested properties
Property nesting is also supported. Reactive property will listen to direct child reactive properties, arrays of properties and dictionaries.
You can aggregate multiple properties into one.
```js
var a = reactiveProperty(1);
var b = reactiveProperty(a); //will listen to a
var c = reactiveProperty([a,b]); //will listen to a & b
var d = reactiveProperty({a:a,c:c}); //will listen to a & c

b.on(function(){
    console.log("B update!");
});

c.on(function(){
    console.log("C update!");
});

a(3); >>> "B update!", "C update!";
```

## Dependency

Reactive property uses [Events library](https://github.com/narushevich/events) for firing "change" event.