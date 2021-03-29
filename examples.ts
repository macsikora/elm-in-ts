import {match, Maybe, Result} from '../elm-in-ts';
{
    type Action = 
    | ["Run", Maybe<number>] 
    | ["Sleep"]

    // mapping to string
    const toStr = (action: Action): string => 
        match(action).with({
            // what compiler is suggesting here?
            Run_Just: distance => "Run " + distance + "km",
            Run_Nothing: () => "Run who knows how far",
            Sleep: () => "Zzzz..."
        })
        
    // using
    const res = toStr(["Run", ["Just",10]]); //?
}

// One level more!
{
    type Request<a> = 
    | ["Success",a] 
    | ["Error", string] 
    | ["Loading"]

    type Action = 
    | ["Run", Maybe<number>] 
    | ["Sleep"]

    // mapping to string
    const toStr = (action: Request<Action>): string => 
        match(action).with({
            // what compiler is suggesting here?
            Loading: () => "Loading...",
            Error: err => "Error: " + err,
            Success_Run_Just: distance => "Run " + distance + "km",
            _: () => "Definitely not running"
        })
        
    // using
    const res = toStr(["Success",["Run", ["Just",10]]]); //?
}
      

// Pattern match over many elements
{

    const f = (x: Result<string, Error>, y: Result<string, Error>, z: Result<string, Error>) => 
        match(x,y,z).with({
            // what compiler is suggesting here?
            "Ok, Ok, Ok": (x,y,z) => [x,y,z],
            _: () => []
        })

}
