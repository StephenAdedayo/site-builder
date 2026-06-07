import React from 'react'

const Footer = () => {

    const year = new Date().getFullYear()
  return (
    <div className='text-center py-4 text-gray-400 text-sm border-t border-gray-800 mt-24'>
      <p>Copyright &copy; {year} AI Website Builder</p>
    </div>
  )
}

export default Footer
