---
url: /blog/2021/12/09/js-learn-json/index.md
---
### JSON

#### `JSON.stringify()`

> `可以传三个参数` `第一个表示需要序列化的对象`,`第二个可以是数组,可以是函数`,`第三个是控制格式`

1. `当第二个参数为数组的时候,如果它们对应着要序列化的对象中的属性,那只会序列化对应的属性`

```js
 let book = {
 title: "Professional JavaScript", 
 authors: [ 
 "Nicholas C. Zakas", 
 "Matt Frisbie" 
 ], 
 edition: 4, 
 year: 2017 
}; 
let jsonText = JSON.stringify(book, ["title", "edition"]);
//{"title":"Professional JavaScript","edition":4}
```

2. `当第二参数是函数的时候`

```js
let book={
 title: "Professional JavaScript", 
 authors: [ 
 "Nicholas C. Zakas", 
 "Matt Frisbie" 
 ], 
 edition: 4, 
  year: 2017
}
let jsonText = JSON.stringify(book, (key, value) => { 
 switch(key) { 
 case "authors": 
 return value.join(",") 
 case "year": 
 return 5000; 
 case "edition": 
 return undefined; 
 default: 
 return value; 
 } 
});
//{"title":"Professional JavaScript","authors":"Nicholas C. Zakas,Matt 
// Frisbie","year":5000}
```

3. `第三个参数 参数控制缩进和空格,在这个参数是数值时 表示每一级缩进的空格数,如果缩进参数是一个字符串而非数值`

```js
let book = { 
 title: "Professional JavaScript", 
 authors: [ 
 "Nicholas C. Zakas", 
 "Matt Frisbie" 
 ], 
 edition: 4, 
 year: 2017 
}; 
let jsonText = JSON.stringify(book, null, 4);

// { 
//  "title": "Professional JavaScript", 
//  "authors": [ 
//  "Nicholas C. Zakas", 
//  "Matt Frisbie" 
//  ], 
//  "edition": 4, 
//  "year": 2017 
// }
```

```js
let jsonText = JSON.stringify(book, null, "--" );
{ 
--"title": "Professional JavaScript", 
--"authors": [ 
----"Nicholas C. Zakas", 
----"Matt Frisbie" 
--], 
--"edition": 4, 
--"year": 2017 
}
```

`如果第三个非字符串 长度超过10 会在第十位截断`

#### ` toJSON()`

> toJSON()方法可以与过滤函数一起使用
> JSON.stringify()时会执行如下步骤。
> (1) 如果可以获取实际的值，则调用 toJSON()方法获取实际的值，否则使用默认的序列化。
> (2) 如果提供了第二个参数，则应用过滤。传入过滤函数的值就是第(1)步返回的值。
> (3) 第(2)步返回的每个值都会相应地进行序列化
