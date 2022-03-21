// helper type
type UnionToIntersection<U> = 
  (U extends any ? (k: U)=>void : never) extends ((k: infer I)=>void) ? I : never
type Sum = [string] | [string, unknown]

// matching single nested type
type MatchSingle<T extends Sum, R> = 
// Three levels deep
UnionToIntersection<T extends [infer A, infer B] ?
(
    B extends [infer BA, infer BB] ?
    (
        BB extends [infer CA, infer CB] ?
        (
            {
                [K in A & string]:
                {
                    [K2 in BA & string]:
                    {
                        [K3 in CA & string]: 
                        {
                            [K4 in `${K}_${K2}_${K3}`]:
                                (x: CB) => R
                        }
                    }
                }
            }[A & string][BA & string][CA & string]
        ) :
        BB extends [infer CA] ?
        (
            {
                [K in A & string]:
                {
                    [K2 in BA & string]:
                    {
                        [K3 in CA & string]: 
                        {
                            [K4 in `${K}_${K2}_${K3}`]:
                                () => R
                        }
                    }
                }
            }[A & string][BA & string][CA & string]
        ) : 
        {
            [K in A & string]:
            {
                [K2 in BA & string]:
                {
                    [K3 in `${K}_${K2}`]: 
                        (x: BB) => R
                }
            }
        }[A & string][BA & string]
    ) : 
    B extends [infer BA] ?
    {
        [K in A & string]:
        {
            [K2 in BA & string]:
            {
                [K3 in `${K}_${K2}`]: 
                    () => R
            }
        }
    }[A & string][BA & string] :
    {
        [K in A & string]:
            (x: B) => R
    }
) : 
T extends [infer A] ?
    {
        [K in A & string]:
            () => R
    } : 
    never
> |
// Two levels deep
UnionToIntersection<T extends [infer A, infer B] ?
(
    B extends [infer BA, infer BB] ?
    {
        [K in A & string]:
        {
            [K2 in BA & string]:
            {
                [K3 in `${K}_${K2}`]: 
                    (x: BB) => R
            }
        }
    }[A & string][BA & string] :
    B extends [infer BA] ?
    {
        [K in A & string]:
        {
            [K2 in BA & string]:
            {
                [K3 in `${K}_${K2}`]: 
                    () => R
            }
        }
    }[A & string][BA & string] :
    {
        [K in A & string]:
            (x: B) => R
    } 
) :
T extends [infer A] ?
    {
        [K in A & string]:
            () => R
    } : 
    never
> |
// One level deep
UnionToIntersection<T extends [infer A, infer B] ?
{
    [K in A & string]:
        (x: B) => R
} :
(    
    T extends [infer A] ?
    {
        [K in A & string]:
            () => R
    } : 
    never
)> |
{
    _: () => R //wildcard
}

type Pattern<T extends Sum, R> = {
    [K in T[0] | '_']: 
        T extends [K, infer B] ? B:
        never
}

// matching tuple
type SumTuple = [Sum, Sum] | [Sum, Sum, Sum]
type MatchMulti<
    T extends SumTuple, 
    R, 
    Tmp extends Record<0 | 1 | 2, Pattern<Sum, R>>= 
    {
    [K in keyof T & 0 | 1 | 2]: 
        Pattern<T[K], R>
    }
> = 
    T extends [Sum, Sum, Sum] ?
    {
        [K in keyof Tmp[0] & string]: {
            [K1 in keyof Tmp[1] & string]: {
                [K2 in keyof Tmp[2] & string]: {
                    [K3 in `${K}, ${K1}, ${K2}`]:
                        Tmp[0][K] extends never ? (
                            Tmp[1][K1] extends never ? (
                                Tmp[2][K2] extends never ?
                                () => R :
                                (x:Tmp[2][K2]) => R 
                            ): (
                                Tmp[2][K2] extends never ?
                                (x: Tmp[1][K1]) => R :
                                (x: Tmp[1][K1], y: Tmp[2][K2]) => R
                            )
                        ):
                        Tmp[1][K1] extends never ? (
                            Tmp[2][K2] extends never ?
                            () => R :
                            (x: Tmp[2][K2]) => R
                        ): 
                        Tmp[2][K2] extends never ? (
                            (x: Tmp[0][K], y: Tmp[1][K1]) => R
                        ):
                        (x: Tmp[0][K], y: Tmp[1][K1], z: Tmp[2][K2]) => R
                } & {
                    '_': () => R
                }
            }
        } 
    }[keyof Tmp[0] & string][keyof Tmp[1] & string][keyof Tmp[2] & string] :
    {
        [K in keyof Tmp[0] & string]: {
            [K1 in keyof Tmp[1] & string]: {
                [K2 in `${K}, ${K1}`]:
                    Tmp[0][K] extends never ? (
                        Tmp[1][K1] extends never ?
                        () => R :
                        (x: Tmp[1][K1]) => R ):
                    Tmp[1][K1] extends never ? (
                        (x: Tmp[0][K]) => R 
                    ): (x: Tmp[0][K], y: Tmp[1][K1]) => R
            } & {
                '_': () => R
            }
        } 
    }[keyof Tmp[0] & string][keyof Tmp[1] & string]


export type Match<T extends [Sum] | SumTuple, R> = 
    T extends SumTuple ?
    MatchMulti<T, R> :
    T extends [Sum] ?
    MatchSingle<T[0], R> :
    never


export const match = <V extends [Sum] | SumTuple>(...v: V) => {
    return {
        with: <R>(pattern: Match<V, R>): R => {
            let keys: string[] = [];
            let val: unknown[] = [];
            let act: unknown[];
            for (act of v) {
                let key = []
                while (true) {
                    const [k, ...v] = act;
                    key.push(k);
                    // TODO The tricky part
                    // How to distinguish if a legit list/tuple value or an action
                    // here just checking if an array and <= 2 - but may not be sufficient
                    if (v.length && Array.isArray(v[0]) && v[0].length <= 2) {
                        act = v[0]; // <- push next level on stack
                        continue;
                    }
                    // Max depth reached
                    keys.push(key.join('_')) // combine keys
                    val.push(...v)
                    break;
                }
            }
            return (
                pattern[keys.join(', ')] // TODO How to index type this 🤷‍♀️
                ?? pattern['_'] // Catch All
                ?? (() => Error("Undefined key or missing 'Catch All'")) // Error
            ).apply(null, val);
        }
    }
}

export type Maybe<A> = 
    | ['Nothing'] 
    | ['Just', A];
export type Result<A, B> = 
    | ['Ok', A] 
    | ['Error', B];

export const fromNullable = <T>(x: T): Maybe<NonNullable<T>> => 
    (x === null || x === undefined) ?
    ["Nothing"] :
    ["Just", x as NonNullable<T>]
