"use client";

import React from "react";

import {
    CheckCircle2,
    Sparkles
} from "lucide-react";

type Props={

    label:string;

    placeholder?:string;

    helper?:string;

    aiNote?:string;

    value:string;

    onChange:(value:string)=>void;

};

export default function ExecutiveInput({

label,

placeholder,

helper,

aiNote,

value,

onChange,

}:Props){

return(

<div className="space-y-4">

<div>

<h3 className="text-white font-semibold text-lg">

{label}

</h3>

{helper &&(

<p className="mt-2 text-slate-400 leading-7">

{helper}

</p>

)}

</div>

{aiNote&&(

<div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 flex gap-3">

<Sparkles className="h-5 w-5 text-blue-400 mt-1"/>

<p className="text-sm leading-7 text-slate-300">

{aiNote}

</p>

</div>

)}

<input

value={value}

placeholder={placeholder}

onChange={(e)=>onChange(e.target.value)}

className="

w-full

rounded-2xl

border

border-white/10

bg-[#0F172A]

px-5

py-4

text-white

placeholder:text-slate-500

focus:border-blue-500

focus:outline-none

transition

"

/>

<div className="flex items-center gap-2 text-emerald-400">

<CheckCircle2 className="h-5 w-5"/>

<p className="text-sm">

AI validation active

</p>

</div>

</div>

);

}
