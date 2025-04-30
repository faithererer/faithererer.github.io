---
title: JavaSE
tags:
  - JavaSE
mathjax: true
cover: 'https://vip1.loli.io/2022/05/11/r1XRaCPvkHu7S2q.jpg'
categories: Java
abbrlink: 14085
---

# 反射

反射是一种 Java 编程语言的特性，它允许在运行时检查类、获取类的信息（如字段、方法、构造函数等），并且可以在运行时动态地创建对象、调用方法和访问属性等。换句话说，反射使得程序能够在运行时检查和操作对象的类和实例。

Java 反射的核心是 `java.lang.reflect` 包，它提供了一组类和接口，用于在运行时检查和操作类的信息。主要的类和接口包括：

- `Class` 类：表示类的运行时类型信息，它包含了类的字段、方法、构造函数等信息。
- `Field` 类：表示类的字段，可以用于获取和设置字段的值。
- `Method` 类：表示类的方法，可以用于调用类的方法。
- `Constructor` 类：表示类的构造函数，可以用于创建类的实例。

通过这些类和接口，可以在运行时动态地获取和操作类的信息，例如：

- 获取类的字段、方法、构造函数等信息。
- 动态地创建类的实例。
- 调用类的方法。
- 获取和设置类的字段的值。

反射通常用于一些需要在编译时无法确定类的情况下，或者需要动态地加载类、调用方法的情况下。例如，当你编写一个通用的框架或库时，无法预先知道客户端会使用哪些类，这时可以使用反射来动态地加载类和调用方法。另外，一些 Java 框架和库（如 Spring、Hibernate）也大量使用了反射来实现各种功能。

---

##### 编译时无法确定类，运行时才能确定，我无法理解，举个例子。

理解起来可能需要考虑一些稍微复杂的情况。让我们通过一个简单的例子来说明：

假设你正在编写一个简单的插件系统，你希望能够在运行时加载不同的插件，并且调用这些插件提供的方法。但是，你在编写主程序时并不知道具体有哪些插件会被加载。

现在，让我们来看一下这个例子的实现：

1. **主程序：** 主程序是一个简单的 Java 应用程序，它负责加载插件并调用它们的方法。

```
javaCopy codepublic class MainProgram {
    public static void main(String[] args) {
        // 在运行时加载插件
        Plugin plugin = loadPlugin("Plugin1");

        // 调用插件的方法
        plugin.doSomething();
    }

    public static Plugin loadPlugin(String pluginName) {
        try {
            // 根据插件名加载相应的类
            Class<?> pluginClass = Class.forName(pluginName);
            
            // 使用反射创建插件类的实例
            Plugin plugin = (Plugin) pluginClass.newInstance();

            return plugin;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
```

1. **插件接口和实现：** 插件接口定义了插件的行为，而插件实现则提供了具体的功能。

```
javaCopy codepublic interface Plugin {
    void doSomething();
}

public class Plugin1 implements Plugin {
    @Override
    public void doSomething() {
        System.out.println("Plugin1 is doing something.");
    }
}
```

在这个例子中，主程序在编译时并不知道具体有哪些插件会被加载，因为插件的类名是在运行时确定的。主程序使用反射动态加载了指定名称的插件类，并调用了插件提供的方法。这就是编译时无法确定类，但在运行时才能确定的情况。

# 泛型

##### 在编译后进行擦除，那为什么运行时可以正常使用，Object不能使用其衍生类的所有功能吧

这是因为 Java 的泛型实现是在编译时进行类型擦除的，但在运行时使用了擦除后的原始类型。当你创建一个泛型实例时，编译器会将泛型类型擦除为其边界或 Object 类型，并在必要时插入类型转换来保证类型安全性。

在运行时，泛型类型参数被擦除为其边界或 Object 类型，但对于调用方法和访问属性等操作，Java 的动态绑定机制仍然会根据实际对象的类型来调用相应的方法和属性。这是因为 Java 是一种面向对象的语言，它支持多态性，即在运行时确定对象的实际类型并调用相应的方法。

因此，即使在泛型擦除后，你仍然可以在运行时正常使用对象的方法和属性。例如，如果你有一个泛型集合，其中元素是某个类的实例，即使在编译时无法知道具体的类型，但在运行时，你仍然可以通过遍历集合来访问每个元素，并调用它们的方法和属性。

总的来说，Java 的泛型擦除只是在编译时进行的，而在运行时仍然可以利用动态绑定机制来调用对象的方法和属性，因此你可以正常使用泛型对象的功能。
