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
import {Logger} from "@sailplane/logger";

const logger = new Logger('injector');

type InjectableClass<T> = {new (...args): T, $inject?: DependencyList, name: string};
type GettableClass<T> = Function & {prototype: T, name: string};
type DependencyList = (InjectableClass<unknown>|string)[];

/** Convert list into array of dependency names */
function toNamedDependencies(list: DependencyList): string[] {
    if (list) {
        return list.map(dep => typeof dep === 'string' ? dep : dep.name);
    }
    else {
        return [];
    }
}

// verifies that automatically injected dependencies are not undefined
(Bottle.config as any).strict = true;

/**
 * Wraps up type-safe version of BottleJs for common uses.
 *
 * The raw bottle is also available.
 */
export class Injector {
    public static readonly bottle = Bottle.pop('global');

    /**
     * This may be called at beginning of process.
     * @deprecated
     */
    static initialize() {
    }

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
    static register<T>(
        clazz: InjectableClass<T>,
        factoryOrDependencies?: (() => T) | DependencyList,
        asName: string = clazz.name
    ): void {
        if (!clazz || !asName) {
            throw new TypeError("Class to register is undefined: " + clazz.toString() + " " + asName);
        }
        else if (Injector.bottle.container[asName] == undefined) {
            if (!factoryOrDependencies) {
                const dependencies = toNamedDependencies(clazz.$inject as DependencyList);
                logger.debug(`Registering class ${clazz.name} with dependencies: ` + dependencies.toString() );
                Injector.bottle.service(asName, clazz, ...dependencies);
            }
            else if (Array.isArray(factoryOrDependencies)) {
                const dependencies = toNamedDependencies(factoryOrDependencies);
                logger.debug(`Registering class ${clazz.name} with dependencies: ` + dependencies.toString() );
                Injector.bottle.service(asName, clazz, ...dependencies);
            }
            else if (typeof factoryOrDependencies === 'function') {
                logger.debug(`Registering class ${clazz.name} with factory`);
                Injector.bottle.factory(asName, factoryOrDependencies);
            }
            else {
                throw new TypeError(`Unknown type of factoryOrDependencies when registering ${clazz.name} with Injector`);
            }
        }
        else {
            logger.warn(`Already registered class ${clazz.name} as ${asName}`);
        }
    }

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
    static registerFactory<T>(name: string, factory: (() => T)): void {
        if (!name) {
            throw new TypeError("Name to register is blank");
        }
        else if (Injector.bottle.container[name] == undefined) {
            logger.debug(`Registering ${name} with factory`);
            Injector.bottle.factory(name, factory);
        }
        else {
            logger.warn(`Already registered factory ${name}`);
        }
    }

    /**
     * Register a named constant value.
     *
     * @see #getByName(name)
     * @param name name to give this constant.
     * @param value value to return when the name is requested.
     * @throws TypeError if duplicate or bad request
     */
    static registerConstant<T>(name: string, value: T): void {
        if (!name) {
            throw new TypeError("Constant name to register is blank");
        }
        else if (Injector.bottle.container[name] == undefined) {
            Injector.bottle.constant(name, value);
        }
        else {
            logger.warn(`Already registered constant "${name}"`);
        }
    }

    /**
     * Get instance of a class.
     * Will instantiate on first request.
     *
     * @param clazz the class to fetch. Ex: MyClass. NOT an instance, the class.
     * @return the singleton instance of the requested class, undefined if not registered.
     */
    static get<T>(clazz: GettableClass<T>): T|undefined {
        return Injector.bottle.container[clazz.name] as T;
    }

    /**
     * Get a registered constant or class by name.
     *
     * @see #registerFactory(name, factory, force)
     * @see #registerConstant(name, value, force)
     * @param name
     * @return the singleton instance registered under the given name,
     *         undefined if not registered.
     */
    static getByName<T>(name: string): T|undefined {
        return Injector.bottle.container[name] as T;
    }

    /**
     * Is a class, factory, or constant registered?
     * Unlike #getByName, will not instantiate if registered but not yet lazy created.
     *
     * @param clazzOrName class or name of factory or constant
     */
    static isRegistered(
        clazzOrName: InjectableClass<unknown> | GettableClass<unknown> | string
    ): boolean {
        const name = typeof clazzOrName === "string" ? clazzOrName : clazzOrName.name;
        return name in Injector.bottle.container;
    }
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
export function Injectable<T>(options?: InjectableOptions<T>) {
    return function (target: InjectableClass<unknown>) {
        let asName: string|undefined = undefined;
        if (typeof options?.as === "function") {
            // Validate that 'as' is a parent class
            let found = false;
            for (let clazz = target; clazz ; clazz = Object.getPrototypeOf(clazz) as InjectableClass<unknown>) {
                if (clazz?.name === options.as.name) {
                    found = true;
                    asName = options.as.name;
                    break;
                }
            }
            if (!found) {
                throw new TypeError(`${options.as.name} is not a parent class of ${target.name} in @Injectable()`);
            }
        }
        else if (typeof options?.as === "string") {
            asName = options.as;
        }

        if (options?.factory && options.dependencies) {
            throw new TypeError(`Cannot specify both factory and dependencies on @Injectable() for ${target.name}`);
        }
        else if (options?.factory || options?.dependencies) {
            Injector.register(target, options.factory ?? options.dependencies, asName);
        }
        else {
            const metadata = Reflect.getMetadata(
                "design:paramtypes", target
            ) as InjectableClass<unknown>[]|undefined;
            const dependencies = metadata?.map(clazz => clazz.name);
            Injector.register(target, dependencies, asName);
        }
    };
}
