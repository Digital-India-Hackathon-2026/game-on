import { InputHTMLAttributes } from "react";
export function Switch(props: InputHTMLAttributes<HTMLInputElement>) { return <input type="checkbox" role="switch" className="h-5 w-10" {...props} />; }
export function Checkbox(props: InputHTMLAttributes<HTMLInputElement>) { return <input type="checkbox" className="h-5 w-5" {...props} />; }
export function Radio(props: InputHTMLAttributes<HTMLInputElement>) { return <input type="radio" className="h-5 w-5" {...props} />; }
