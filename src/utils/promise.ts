

const PromiseUtils = {
    ...Promise,
    
    
    ///////////////////////////////////////////////////////////////////////////////
    // awaits each promise in sequence, storing the results in an array
    async sequential<T = any>(...promises: Promise<T>[]) {
        const result: T[] = []
        for(let i = 0; i < promises.length; i++) {
            result.push(await promises[i]);
        }

        return result;
    },
    
    
    ///////////////////////////////////////////////////////////////////////////////
    // awaits each promise in sequence, storing the results in an array
    async * sequentialGenerator<T = any>(...promises: Promise<T>[]): AsyncGenerator<T> {
        for(let i = 0; i < promises.length; i++) {
            yield await promises[i];
        }
    },
}

export default PromiseUtils

