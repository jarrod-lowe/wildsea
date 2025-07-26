import React from 'react'

const MDEditor = ({ value, onChange, textareaProps }) => {
  return <textarea 
    id={textareaProps?.id} 
    placeholder={textareaProps?.placeholder} 
    value={value} 
    onChange={(e) => onChange(e.target.value)}
  />
}

export interface ICommand {
  name: string;
}

export function getCommands(): ICommand[] {
  return [];
}

export default MDEditor
