---
url: /blog/2021/07/31/js-learn-8/index.md
---
### js高级程序设计第八章

> 只是截取我认为重要的!!!

#### 如果要确定某个属性是否存在于原型上

```js
function hasPrototypeProperty(object, name){ 
 return !object.hasOwnProperty(name) && (name in object); 
}
```

`object.hasOwnProperty(name)`判断是否在当前实例 `(name in object)` 后者都可以 所以前者取反
`只要通过对象可以访问，in 操作符就返回 true，而 hasOwnProperty()只有属性存在于实例上时才返回 true。因此，只要in 操作符返回 true 且 hasOwnProperty()返回 false，就说明该属性是一个原型属性`

#### 属性枚举顺序

`for-in 循环和 Object.keys()的枚举顺序是不确定的`
`Object.getOwnPropertyNames()、Object.getOwnPropertySymbols()和 Object.assign()的枚举顺序是确定性的。先以升序枚举数值键，然后以插入顺序枚举字符串和符号键`

1. 经典面试题  判断输出顺序

```js
let k1 = Symbol('k1'), 
 k2 = Symbol('k2'); 
let o = { 
 1: 1, 
 first: 'first', 
 [k1]: 'sym2', 
 second: 'second', 
 0: 0 
}; 
o[kk2] = 'sym2'; 
o[3] = 3; 
o.third = 'third'; 
o[2] = 2; 
// for(let key in o){
//   console.log(key) //0", "1", "2", "3", "first", "second", "third"
// }

// console.log(Object.getOwnPropertyNames(o)); 

// ["0", "1", "2", "3", "first", "second", "third"]
console.log(Object.getOwnPropertySymbols(o)); 
// [Symbol(k1), Symbol(k2)]
```

应用上述规则 完美回答

#### 原型链

> 个原型本身有一个内部指针指向另一个原型，相应地另一个原型也有一个指针指向另一个构造函
> 数。这样就在实例和原型之间构造了一条原型链。这就是原型链的基本构想

```js
function SuperType() { 
 this.property = true; 
} 
SuperType.prototype.getSuperValue = function() { 
 return this.property; 
}; 
function SubType() { 
 this.subproperty = false; 
} 
// 继承 SuperType 
SubType.prototype = new SuperType(); 
SubType.prototype.getSubValue = function () { 

 return this.subproperty; 
}; 
let instance = new SubType(); 
console.log(instance.getSuperValue()); // true
```

`以上代码定义了两个类型：SuperType 和 SubType。这两个类型分别定义了一个属性和一个方法。这两个类型的主要区别是SubType 通过创建 SuperType 的实例并将其赋值给自己的原型 SubTtype. prototype 实现了对 SuperType 的继承。这个赋值重写了 SubType 最初的原型，将其替换为SuperType 的实例。这意味着 SuperType 实例可以访问的所有属性和方法也会存在于 SubType. prototype。这样实现继承之后，代码紧接着又给 SubType.prototype，也就是这个 SuperType 的实例添加了一个新方法。最后又创建了 SubType 的实例并调用了它继承的 getSuperValue()方法。图下展示了子类的实例与两个构造函数及其对应的原型之间的关系`

![图 8-1](/_missing-image.svg)

`。任何函数的默认原型都是一个 Object 的实例`
![图 8-2](/_missing-image.svg)
`SubType` 继承 `SuperType，而` `SuperType` 继承 `Object。在调用` `instance.toString()`时，实
际上调用的是保存在 `Object.prototype` 上的方法

*== `以对象字面量方式创建原型方法会破坏之前的原型链` ==*

```js
function SuperType() { 
 this.property = true;
} 
SuperType.prototype.getSuperValue = function() { 
 return this.property; 
}; 
function SubType() { 
 this.subproperty = false; 
} 
// 继承 SuperType 
SubType.prototype = new SuperType(); 
// 通过对象字面量添加新方法，这会导致上一行无效
SubType.prototype = { 
 getSubValue() { 
 return this.subproperty; 
 }, 
 someOtherMethod() { 
 return false; 
 } 
}; 
let instance = new SubType(); 
console.log(instance.getSuperValue()); // 出错！
```

`在这段代码中，子类的原型在被赋值为 SuperType 的实例后，又被一个对象字面量覆盖了。覆盖后的原型是一个 Object 的实例，而不再是 SuperType 的实例。因此之前的原型链就断了。SubType和 SuperType 之间也没有关系了`

##### 原型链的问题

> 原型中包含的引用值会在所有实例间共享

```js
function SuperType() { 
 this.colors = ["red", "blue", "green"]; 
} 
function SubType() {} 
// 继承 SuperType 
SubType.prototype = new SuperType(); 
let instance1 = new SubType(); 
instance1.colors.push("black"); 
console.log(instance1.colors); // "red,blue,green,black" 
let instance2 = new SubType(); 
console.log(instance2.colors); // "red,blue,green,black"
```

> 子类型在实例化时不能给父类型的构造函数传参

#### 盗用构造函数

> 为了解决原型包含引用值导致的继承问题

```js
function SuperType() { 
 this.colors = ["red", "blue", "green"]; 
} 
function SubType() { 
 // 继承 SuperType 
 SuperType.call(this); 
} 
let instance1 = new SubType(); 
instance1.colors.push("black"); 
console.log(instance1.colors); // "red,blue,green,black" 
let instance2 = new SubType(); 
console.log(instance2.colors); // "red,blue,green"
```

> 优点:可以在子类构造函数中向父类构造函数传参
> 缺点: ：必须在构造函数中定义方法，因此函数不能重用,子类也不能访问父类原型上定义的方法

```js
function SuperType(name){ 
 this.name = name; 
}
function SubType() { 
 // 继承 SuperType 并传参
 SuperType.call(this, "Nicholas"); 
 // 实例属性
 this.age = 29; 
} 
let instance = new SubType(); 
console.log(instance.name); // "Nicholas"; 
console.log(instance.age); // 29
```

#### 组合继承 (综合了原型链和盗用构造函数)

```js
function SuperType(name){ 
 this.name = name; 
 this.colors = ["red", "blue", "green"]; 
} 
SuperType.prototype.sayName = function() { 
 console.log(this.name); 
}; 
function SubType(name, age){ 
 // 继承属性
 SuperType.call(this, name); 
 this.age = age; 
} 
// 继承方法
SubType.prototype = new SuperType(); 
SubType.prototype.sayAge = function() { 
 console.log(this.age); 
}; 
let instance1 = new SubType("Nicholas", 29); 
instance1.colors.push("black"); 
console.log(instance1.colors); // "red,blue,green,black" 
instance1.sayName(); // "Nicholas"; 
instance1.sayAge(); // 29 
let instance2 = new SubType("Greg", 27); 
console.log(instance2.colors); // "red,blue,green" 
instance2.sayName(); // "Greg"; 
instance2.sayAge(); // 27 
```

#### 寄生式组合继承

基本模式如下所示：

```js
function inheritPrototype(subType, superType) { 
 let prototype = object(superType.prototype); // 创建对象
 prototype.constructor = subType; // 增强对象 
 subType.prototype = prototype; // 赋值对象
}
```

#### 类

> 类可以像函数一样在任何地方定义，比如在数组中

```js
let classList = [ 
 class { 
 constructor(id) { 
 this.id_ = id; 
 console.log(`instance ${this.id_}`); 
 } 
 } 
]; 
function createInstance(classDefinition, id) { 
 return new classDefinition(id); 
} 
let foo = createInstance(classList[0], 3141); // instance 3141
```

> 在类块中定义的所有内容都会定义在类的原型上

#### 静态类方法

> 在静态成员中，this 引用类自身

#### super

1. super 只能在派生类构造函数和静态方法中使用。

```js
class Vehicle { 
 constructor() { 
 super(); 
 // SyntaxError: 'super' keyword unexpected 
 } 
}
```

2. 不能单独引用 super 关键字，要么用它调用构造函数，要么用它引用静态方法

```js
class Vehicle {} 
class Bus extends Vehicle { 
 constructor() { 
 console.log(super); 
 // SyntaxError: 'super' keyword unexpected here 
 } 
}
```

3. 调用 super()会调用父类构造函数，并将返回的实例赋值给 this
4. super()的行为如同调用构造函数，如果需要给父类构造函数传参，则需要手动传入。

```js
class Vehicle { 
 constructor(licensePlate) { 
 this.licensePlate = licensePlate; 
 } 
} 
class Bus extends Vehicle { 
 constructor(licensePlate) { 
 super(licensePlate); 
 } 
} 
console.log(new Bus('1337H4X')); // Bus { licensePlate: '1337H4X' }
```

5. 如果没有定义类构造函数，在实例化派生类时会调用 super()，而且会传入所有传给派生类的
   参数

```js
class Vehicle { 
 constructor(licensePlate) { 
 this.licensePlate = licensePlate; 
 } 
} 
class Bus extends Vehicle {} 
console.log(new Bus('1337H4X')); // Bus { licensePlate: '1337H4X' }
```

6. 在类构造函数中，不能在调用 super()之前引用 this

```js
  class Vehicle {} 
class Bus extends Vehicle { 
 constructor() { 
  // super()
 console.log(this); 
 } 
} 
new Bus();
```

7. 如果在派生类中显式定义了构造函数，则要么必须在其中调用 super()，要么必须在其中返回
   一个对象

```js
class Vehicle {} 
class Car extends Vehicle {} 
class Bus extends Vehicle { 
 constructor() { 
 super(); 
 } 
} 
class Van extends Vehicle { 
 constructor() { 
 return {}; 
 } 
} 
console.log(new Car()); // Car {} 
console.log(new Bus()); // Bus {} 
console.log(new Van()); // {}
```
