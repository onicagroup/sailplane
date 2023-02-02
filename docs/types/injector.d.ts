/**
 * Dependency Injection (DI) injector.
 *
 * Using BottleJs because it is _extremely_ light weight and lazy-instantiate,
 * unlike any Typescript-specific solutions.
 *
 * @see https://github.com/young-steveo/bottlejs
 */
import "reflect-metadata";
import Bottle from 'bottlejs';
type InjectableClass<T> = {
    new (...args: any[]): T;
    $inject?: DependencyList;
    name: string;
};
type GettableClass<T> = Function & {
    prototype: T;
    name: string;
};
type DependencyList = (InjectableClass<unknown> | string)[];
/**
 * Wraps up type-safe version of BottleJs for common uses.
 *
 * The raw bottle is also available.
 */
export declare class Injector {
    static readonly bottle: Bottle<string>;
    /**
     * This may be called at beginning of process.
     * @deprecated
     */
    static initialize(): void;
    /**
     * Register a class.
     *
     * Example service that lazy instantiates with no arguments:
     * - Injector.register(MyServiceClass);
     *
     * Example service that lazy instantiates with other registered items as arguments to
     * the constructor:
     * - Injector.register(MyServiceClass, [DependentClass, OtherClass, 'constant-name']);
     *
     * Example service that lazy instantiates with other registered items specified
     * as $inject:
     * - class MyServiceClass {
     * -   static readonly $inject = [OtherClass, 'constant-name'];
     * -   constructor(other, constValue) {};
     * - }
     * - Injector.register(MyServiceClass);
     *
     * Example service that lazy instantiates with a factory function:
     * - Injector.register(MyServiceClass,
     * -                   () => new MyServiceClass(Injector.get(OtherClass)!, MyArg));
     *
     * @param clazz the class to register. Ex: MyClass. NOT an instance, the class.
     * @param factoryOrDependencies see above examples. Optional.
     * @param asName by default is clazz.name, but may specify another name to register as
     * @throws TypeError if duplicate or bad request
     */
    static register<T>(clazz: InjectableClass<T>, factoryOrDependencies?: (() => T) | DependencyList, asName?: string): void;
    /**
     * Register a factory by name.
     *
     * Example:
     * - Injector.registerFactory('MyThing', () => Things.getOne());
     *
     * @see #getByName(name)
     * @param name name to give the inject.
     * @param factory function that returns a class.
     * @throws TypeError if duplicate or bad request
     */
    static registerFactory<T>(name: string, factory: (() => T)): void;
    /**
     * Register a named constant value.
     *
     * @see #getByName(name)
     * @param name name to give this constant.
     * @param value value to return when the name is requested.
     * @throws TypeError if duplicate or bad request
     */
    static registerConstant<T>(name: string, value: T): void;
    /**
     * Get instance of a class.
     * Will instantiate on first request.
     *
     * @param clazz the class to fetch. Ex: MyClass. NOT an instance, the class.
     * @return the singleton instance of the requested class, undefined if not registered.
     */
    static get<T>(clazz: GettableClass<T>): T | undefined;
    /**
     * Get a registered constant or class by name.
     *
     * @see #registerFactory(name, factory, force)
     * @see #registerConstant(name, value, force)
     * @param name
     * @return the singleton instance registered under the given name,
     *         undefined if not registered.
     */
    static getByName<T>(name: string): T | undefined;
    /**
     * Is a class, factory, or constant registered?
     * Unlike #getByName, will not instantiate if registered but not yet lazy created.
     *
     * @param clazzOrName class or name of factory or constant
     */
    static isRegistered(clazzOrName: InjectableClass<unknown> | GettableClass<unknown> | string): boolean;
}
/** Options for Injectable decorator */
export interface InjectableOptions<T> {
    /**
     * Register "as" this parent class or name.
     * A class *must* be a parent class.
     * The name string works for interfaces, but lacks type safety.
     */
    as?: GettableClass<unknown> | string;
    /** Don't auto-detect constructor dependencies - use this factory function instead */
    factory?: () => T;
    /** Don't auto-detect constructor dependencies - use these instead */
    dependencies?: DependencyList;
}
/**
 * Typescript Decorator for registering classes for injection.
 *
 * Must enable options in tsconfig.json:
 * {
 *   "compilerOptions": {
 *     "experimentalDecorators": true,
 *     "emitDecoratorMetadata": true
 *   }
 * }
 *
 * Usage:
 *
 * Like Injector.register(MyServiceClass, [Dependency1, Dependency2]
 *   @Injectable()
 *   class MyServiceClass {
 *       constructor(one: Dependency1, two: Dependency2) {}
 *   }
 *
 * Like Injector.register(MyServiceClass, [Dependency1, "registered-constant"]
 *   @Injectable({dependencies=[Dependency1, "registered-constant"]})
 *   class MyServiceClass {
 *       constructor(one: Dependency1, two: string) {}
 *   }
 *
 * Like Injector.register(MyServiceClass, () = new MyServiceClass())
 *   @Injectable({factory: () = new MyServiceClass()})
 *   class MyServiceClass {
 *   }
 *
 * Like Injector.register(HexagonalPort, () => new HexagonalAdaptor())
 *   abstract class HexagonalPort {
 *     abstract getThing(): string;
 *   }
 *   @Injectable({as: HexagonalPort })
 *   class HexagonalAdaptor extends HexagonalPort {
 *     getThing() { return "thing"; }
 *   }
 */
export declare function Injectable<T>(options?: InjectableOptions<T>): (target: InjectableClass<unknown>) => void;
export {};
