# reactive-property

> Define reactive properties in your JavaScript objects. Reactive properties notify when they change.

## Usage

```js
function Person(){

}

//DEFINE:
//You can define your property in prototype. You can also define it on the instance of object.
//First parameter is default value, second - optional value validator
MyClass.prototype.name = reactiveProperty("unnamed", function(value){
    return typeof value === "string";
}

var person = new Person;

//READ:
person.name(); //>>>"unnamed"

//WRITE:
person.name("Ivan");

//READ PREVIOUS VALUE:
person.name(person.name.OLD); //>>>"unnamed"

//subscribe to property change
person.name(person.name.CHANGE, function(person, val, data){
    console.log(data+val);
}, "Name changed to ");

person.name("John"); //>>>"Name changed to John"

person.name(); //>>>"John"
```