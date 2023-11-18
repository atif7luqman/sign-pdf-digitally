import { useState } from 'react'
import MySignature from './assets/MySignature'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <MySignature></MySignature>
    </>
  )
}

export default App
