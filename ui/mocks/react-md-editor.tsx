import React from 'react'

const MDEditor = ({ value, onChange, placeholder, id }) => {
  return <textarea id={id} placeholder={placeholder} value={value} onChange={onChange}/>
}

export interface ICommand {
  name: string;
}

export function getCommands(): ICommand[] {
  return [];
}

export default MDEditor
