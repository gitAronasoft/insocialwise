import React from 'react'

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12 footer-copyright text-center">
            <p className="mb-0">Copyright <span className="year-update"> </span> © insocialwise {currentYear} </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
