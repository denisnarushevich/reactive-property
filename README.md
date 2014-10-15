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
person.name.onChange(function(property, args){
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

## Dependency

Reactive property uses [Events library](https://github.com/narushevich/events) for firing "change" event.