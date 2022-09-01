export const flattenArr = (arr) => {
    return arr.reduce((map, item) => {
        map[item.id] = item
        return map
    }, {})
}

export const objToArr = (obj) => {
  // object.keys()若处理对象，返回可枚举的属性数组;若处理数组，返回索引值数组
  /*
   * let person = {name:“张三”,age:25,address:“深圳”,getName:function(){}}
   * Object.keys(person)  // [“name”, “age”, “address”,“getName”]
   * */ 
    return  Object.keys(obj).map(key => obj[key])
}

export const getParentNode = (node, parentClassName) => {
    let current = node
    while(current !== null) {
        // element classlist contains
      if (current.classList.contains(parentClassName)) {
        return current
      }
      current = current.parentNode
    }
    return false
  }

export const timestampToString = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString() + ' ' +  date.toLocaleTimeString()
}