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
    console.log("Name changed from "+args.old()+" to "+args());
});

//set value
person.name("Ivan"); //>>>"Name changed from John to Ivan"

person.name(); //>>>"Ivan"
```

## Aggregate properties
Property aggregating is also supported. Means you can aggregate multiple properties into one.
Reactive property will listen to direct child reactive properties and arrays of properties.
```js
var a = reactiveProperty(1);
var b = reactiveProperty(2);
var ab = reactiveProperty([a,b]); //will listen to a & b and fire change when a or b changes.

ab.onChange(function(){
    console.log("A or B update!");
});

a(3);// >>> "A or B updated!";
```