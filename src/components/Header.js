import React, { useState, useEffect,useContext } from 'react';
import { Link, useLocation, useNavigate  } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

export default function Header() {

  const location = useLocation(); 
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const [authInfo, setauthInfo] = useState(null);
  // useEffect(() => {
  //   const userInfoData = JSON.parse(localStorage.getItem('userinfo'));
  //   if (userInfoData && userInfoData.userData) {
  //     setauthInfo(userInfoData.userData);
  //   } else {
  //     setauthInfo(null);
  //   }
  // }, []);
  useEffect(() => {
    const setUserFromLocalStorage = () => {
      const userInfoData = JSON.parse(localStorage.getItem('userinfo'));
      if (userInfoData && userInfoData.userData) {
        setauthInfo(userInfoData.userData);
      } else {
        setauthInfo(null);
      }
    };
    setUserFromLocalStorage();
    window.addEventListener('userinfoUpdated', setUserFromLocalStorage);
    return () => window.removeEventListener('userinfoUpdated', setUserFromLocalStorage);
  }, []);

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        navigate('/login');
      } else {        
        toast.error("Failed to logout. Please try again.", {
            position: 'top-right',
            autoClose: 5000,
            autoClose: true,
            hideProgressBar: false,
            closeOnClick: true,
            theme: "colored",
        });
      }
    } catch (err) {
      toast.error('Unexpected error during logout. Please try again.', {
        position: 'top-right',
        autoClose: 5000,
        autoClose: true,
        hideProgressBar: false,
        closeOnClick: true,
        theme: "colored",
      });
    }
  };

  return (
    <div className="page-header">
      <div className="header-wrapper row m-0">
        <form className="form-inline search-full col" action="#" method="get">
          <div className="form-group w-100">
            <div className="Typeahead Typeahead--twitterUsers">
              <div className="u-posRelative">
                <input
                  className="demo-input Typeahead-input form-control-plaintext w-100"
                  type="text"
                  placeholder="Search Anything Here..."
                  name="q"
                  title=""
                />
                <div className="spinner-border Typeahead-spinner" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <i className="close-search" data-feather="x"></i>
              </div>
              <div className="Typeahead-menu"></div>
            </div>
          </div>
        </form>
        <div className="header-logo-wrapper col-auto p-0">
          <div className="logo-wrapper">
            <Link to="/">
              <img
                className="img-fluid for-light"
                src="..</Linkssets/images/logo/logo.png"
                alt=""
              />
              <img
                className="img-fluid for-dark"
                src="..</Linkssets/images/logo/logo_dark.png"
                alt=""
              />
            </Link>
          </div>
          <div className="toggle-sidebar">
            <i className="status_toggle middle sidebar-toggle" data-feather="align-center"></i>
          </div>
        </div>
        <div className="nav-right col-xxl-12 col-xl-12 col-md-7 col-12 pull-right right-header p-0">
          <div>
            <div className='row'>
              <div className='col-md-12'>
                <div className='d-flex w-100 align-items-center gap-3 justify-content-between welcome-heading p-0'>
                  <div> {authInfo ? (
                    <h2>Welcome back, {authInfo.firstName} {authInfo.lastName}! 👋  </h2>
                  ) : (
                    <h3>Welcome back, Guest</h3>
                  )}
                    <p> Let's make magic happen with your social media strategy </p>
                  </div>
                  <div>
                    <div className='d-flex align-items-center gap-4 justify-content-between'>
                      <div>
                        <div className="input-group header-search">
                          <span className="input-group-text " id="basic-addon1"> <i className="fa-solid fa-magnifying-glass"></i> </span>
                          <input type="text" className="form-control" placeholder="Search... " aria-label="Username" aria-describedby="basic-addon1" />
                        </div>
                      </div>
                      <div>
                        <div className='fs-6'> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bell h-5 w-5"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg> </div>
                      </div>
                      <div> 
                        <div className='custom-profile-btn' style={{cursor:'pointer'}}> 
                          <span className='dropdown-toggle dropdown-toggle-split' data-bs-toggle="dropdown" aria-expanded="false">                        
                            {authInfo ? (
                              authInfo.profileImage ? (
                                <img
                                  src={`${process.env.REACT_APP_BACKEND_URL}${authInfo.profileImage}`}
                                  alt="Profile"
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    //objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <>
                                  {authInfo.firstName?.charAt(0).toUpperCase()}
                                  {authInfo.lastName ? authInfo.lastName.charAt(0).toUpperCase() : ""}
                                </>
                              )
                            ) : (
                              <></>
                            )}
                          </span>
                          <ul className="dropdown-menu">
                              <li>
                                <Link to="/settings" className="dropdown-item">
                                   <svg xmlns="http://www.w3.org/2000/svg" 
                                      width="24" height="24" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      className="lucide lucide-user h-5 w-5">
                                    <path d="M20 21a8 8 0 0 0-16 0"/>
                                    <circle cx="12" cy="7" r="4"/>
                                  </svg> My Profile
                                </Link>
                              </li>
                              {/* <li>
                                <Link to="/settings" className="dropdown-item" href="javascript:void(0);">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings h-5 w-5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg> Settings
                                </Link>
                              </li> */}
                              <li>
                                <a className="dropdown-item" href="javascript:void(0);" onClick={handleLogout}>
                                  <svg xmlns="http://www.w3.org/2000/svg" 
                                      width="24" height="24" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      className="lucide lucide-log-out h-5 w-5">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                    <polyline points="16 17 21 12 16 7"/>
                                    <line x1="21" y1="12" x2="9" y2="12"/>
                                  </svg> Logout 
                                </a>
                              </li>
                          </ul>                       
                         {/* <button
                                type="button"
                                className="btn custom-btn-info dropdown-toggle dropdown-toggle-split w-25"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                <span className="visually-hidden">Toggle Dropdown</span>
                          </button>
                            <ul className="dropdown-menu">
                              <li><Link className="dropdown-item" to="/my-profile">My Profile</Link></li>
                              <li><a className="dropdown-item" href="javascript:void(0);">Settings</a></li>
                              <li><a className="dropdown-item" href="javascript:void(0);" onClick={handleLogout}>Logout </a></li>
                            </ul> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/*<ul className="nav-menus">
             <li className="onhover-dropdown">
              <div className="notification-box">
                <i className="fa-solid fa-bell">
                  <use href="..</Linkssets/svg/icon-sprite.svg#notification"></use>
                </i>
                <span className="badge rounded-pill badge-success">4 </span>
              </div>
              <div className="onhover-show-div notification-dropdown">
                <h6 className="f-18 mb-0 dropdown-title">Notifications</h6>
                <ul>
                  <li className="b-l-primary border-4 toast default-show-toast align-items-center text-light border-0 fade show" aria-live="assertive" aria-atomic="true" data-bs-autohide="false">
                    <div className="d-flex justify-content-between">
                      <div className="toast-body">
                        <p>Delivery processing</p>
                      </div>
                      <button className="btn-close btn-close-white me-2 m-auto" type="button" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                  </li>
                  <li className="b-l-success border-4 toast default-show-toast align-items-center text-light border-0 fade show" aria-live="assertive" aria-atomic="true" data-bs-autohide="false">
                    <div className="d-flex justify-content-between">
                      <div className="toast-body">
                        <p>Order Complete</p>
                      </div>
                      <button className="btn-close btn-close-white me-2 m-auto" type="button" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                  </li>
                  <li className="b-l-secondary border-4 toast default-show-toast align-items-center text-light border-0 fade show" aria-live="assertive" aria-atomic="true" data-bs-autohide="false">
                    <div className="d-flex justify-content-between">
                      <div className="toast-body">
                        <p>Tickets Generated</p>
                      </div>
                      <button className="btn-close btn-close-white me-2 m-auto" type="button" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                  </li>
                  <li className="b-l-warning border-4 toast default-show-toast align-items-center text-light border-0 fade show" aria-live="assertive" aria-atomic="true" data-bs-autohide="false">
                    <div className="d-flex justify-content-between">
                      <div className="toast-body">
                        <p>Delivery Complete</p>
                      </div>
                      <button className="btn-close btn-close-white me-2 m-auto" type="button" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                  </li>
                </ul>
              </div>
            </li> */}
            {/* <li className="profile-nav onhover-dropdown pe-0 py-0">
              <div className="d-flex profile-media">
                  <img
                    className="b-r-20"
                    src={`${process.env.PUBLIC_URL}/assets/images/user/profile-img.png`}
                    alt=""
                    style={{width:'35px',height:'35px'}}
                  />
                  <div className="flex-grow-1">
                    {authInfo ? (
                      <span>{authInfo.firstName} {authInfo.lastName}</span>
                    ) : (
                      <span>Emay Walter</span>
                    )}
                  </div>
              </div>
              <ul className="profile-dropdown onhover-show-div">
                <li>
                  <Link to="#">
                    <i className="fa fa-user" style={{color:'#3F475A'}}></i> <span>My Profile </span>
                  </Link>
                </li>
                <li onClick={handleLogout}>
                  <span>
                    <i className="fa fa-sign-out"></i> <span>LOG OUT</span>
                  </span>
                </li>
              </ul>
            </li> 
          </ul>*/}
        </div>
      </div>
    </div>
  );
}