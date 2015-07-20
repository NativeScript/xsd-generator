interface Action<T>
{
    (item: T): void;
}

interface Func0<TResult>
{
    (): TResult;
}

interface Func1<T,TResult>
{
    (item: T): TResult;
}
