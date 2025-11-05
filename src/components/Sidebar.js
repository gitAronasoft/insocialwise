import React from 'react';
import { Link,useLocation} from 'react-router-dom';

export default function Sidebar() {  
  const location = useLocation();
  return (
    <div className="sidebar-wrapper" data-sidebar-layout="stroke-svg">
      <div>
        <div className="logo-wrapper">
          {/* <Link to="/dashboard">
            <img className="img-fluid for-light me-1" style={{ width: 25 }} src={`${process.env.PUBLIC_URL}/assets/images/logo/logo.svg`} alt="" />
            <img className="img-fluid for-dark" style={{ width: 25 }} src={`${process.env.PUBLIC_URL}/assets/images/logo/logo.svg`} alt="" />
           <span className='logoname'>insocialwise </span>
          </Link> */}

            <div> 
              <Link to="/dashboard" className='d-flex gap-2'>
              {/* <div className='logo-ican'> 
                <img className="img-fluid for-light" style={{ width: 25 }} src={`${process.env.PUBLIC_URL}/assets/images/logo/logo.svg`} alt="" />
              </div> */}

              {/* <div class="logo-ican"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap h-7 w-7 text-white"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg></div> */}

                  <div class="logo-ican rounded-4 d-flex align-items-center justify-content-center">
                    <img src={`${process.env.PUBLIC_URL}/assets/images/logo/in-social-icon.png`} alt="Logo" style={{ width: 50 }}/>
                    {/* <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap">
                      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                    </svg> */}
                  </div>
                       
                      <div className='d-flex flex-column '> 
                      <div className='logoname'>insocialwise </div>
                      <p> Social Media Dashboard </p>
                      </div>
              </Link>
            </div>


          {/* <div className="back-btn">
            <i className="fa-solid fa-angle-left"></i>
          </div>
          <div className="toggle-sidebar" checked="checked">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-grid status_toggle middle sidebar-toggle">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div> */}
        </div>
        <div className="logo-icon-wrapper">
          <Link to="">
            <img className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/images/logo/logo-icon.png`} alt="" />
          </Link>
        </div>
        <nav className="sidebar-main">
          <div className="left-arrow disabled" id="left-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-left">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </div>
          <div id="sidebar-menu">
            <ul className="sidebar-links" id="simple-bar" data-simplebar="init" style={{ display: "block" }}>
              <div className="simplebar-wrapper" style={{ margin: "0px" }}>
                <div className="simplebar-height-auto-observer-wrapper">
                  <div className="simplebar-height-auto-observer"></div>
                </div>
                <div className="simplebar-mask">
                  <div className="simplebar-offset" style={{ right: "0px", bottom: "0px" }}>
                    <div className="simplebar-content-wrapper" style={{ height: "100vh", overflow: "hidden scroll" }}>
                      <div className="simplebar-content" style={{ padding: "0px",height:'100vh' }}>
                        <li className="back-btn">
                          <Link to="">
                            <img className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/images/logo/logo-icon.png`} alt="" />
                          </Link>
                          <div className="mobile-back text-end"><span>Back</span><i className="fa-solid fa-angle-right ps-2" aria-hidden="true"></i></div>
                        </li>
                        <li className="pin-title sidebar-main-title">
                          <div>
                            <h6>Pinned</h6>
                          </div>
                        </li>                        
                        
                        <li className="sidebar-list">
                          <i className="fa-solid fa-thumbtack"></i>
                          <Link to="/dashboard" className={`sidebar-link sidebar-title link-nav ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-dashboard h-5 w-5"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg> <span>Dashboard</span>
                            <div className="according-menu">
                              <i className="fa-solid fa-angle-right"></i>
                            </div>
                          </Link>
                        </li>

                        <li className="sidebar-list">
                          <i className="fa-solid fa-thumbtack"></i>
                          <Link to="/all-accounts" className={`sidebar-link sidebar-title link-nav ${location.pathname === '/all-accounts' ? 'active' : ''}`}>
                            {/* <i className={`fa-solid fa-users ${location.pathname === '/all-accounts' ? 'iconActive' : ''}`}></i>  */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24"  height="24"fill="none"
                              viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                              strokeLinecap="round"  strokeLinejoin="round"
                              className=""
                            >
                              <path d="M16 19h4a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-2m-2.236-4a3 3 0 1 0 0-4" />
                              <path d="M3 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
                              <path d="M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                            
                            <span>All Accounts</span>                          
                            <div className="according-menu">
                              <i className="fa-solid fa-angle-right"></i>
                            </div>
                          </Link>
                        </li>

                        {/* <li className="sidebar-list">
                          <i className="fa-solid fa-thumbtack"></i>
                          <Link to="/connect-app" className={`sidebar-link sidebar-title link-nav ${location.pathname === '/connect-app' ? 'active' : ''}`}>
                            <i className={`fa-brands fa-facebook ${location.pathname === '/connect-app' ? 'iconActive' : ''}`}></i> <span>Connect Account</span>
                            <div className="according-menu">
                              <i className="fa-solid fa-angle-right"></i>
                            </div>
                          </Link>
                        </li> */}

                        <li className="sidebar-list">
                          <i className="fa-solid fa-thumbtack"></i>
                          <Link to="/posts-list" className={`sidebar-link sidebar-title link-nav ${location.pathname === '/posts-list' ? 'active' : ''}`}>
                            {/* <i className={`fa-solid fa-list ${location.pathname === '/posts-list' ? 'iconActive' : ''}`}></i>  */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                              fill="none" viewBox="0 0 24 24" stroke="currentColor"
                              strokeWidth="2" strokeLinecap="round" className=""
                            >
                              <path d="M9 8h10M9 12h10M9 16h10M4.99 8H5m-.02 4h.01m0 4H5" />
                            </svg>

                            <span>Posts list</span>                          
                            <div className="according-menu">
                              <i className="fa-solid fa-angle-right"></i>
                            </div>
                          </Link>
                        </li>

                        {/* <li className="sidebar-list">
                          <i className="fa-solid fa-thumbtack"></i>
                          <Link to="/draft-posts" className={`sidebar-link sidebar-title link-nav ${location.pathname === '/draft-posts' ? 'active' : ''}`}>
                            <i className={`fa-solid fa-compass-drafting ${location.pathname === '/draft-posts' ? 'iconActive' : ''}`}></i> 
                            <span>Draft posts</span>                          
                            <div className="according-menu">
                              <i className="fa-solid fa-angle-right"></i>
                            </div>
                          </Link>
                        </li> */}

                        {/* <li className="sidebar-list">
                          <i className="fa-solid fa-thumbtack"></i>
                          <Link to="/draft-posts" className={`sidebar-link sidebar-title link-nav ${location.pathname === "/draft-posts" ? "active" : ""}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" 
                              viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" 
                              className={`me-2 ${location.pathname === "/draft-posts"}`}>
                              <path d="M6 2h9l5 5v15H6V2z" />
                              <path d="M14 2v6h6" />
                              <path d="M9 13h6M9 17h6" />
                            </svg>
                            <span>Draft Posts</span>
                            <div className="according-menu">
                              <i className="fa-solid fa-angle-right"></i>
                            </div>
                          </Link>
                        </li> */}

                        <li className="sidebar-list">
                          <i className="fa-solid fa-thumbtack"></i>
                          <Link to="/allposts" className={`sidebar-link sidebar-title link-nav ${location.pathname === "/allposts" ? "active" : "" }`} >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
                              viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                              className={`me-2 ${location.pathname === "/allposts"}`}>
                              <path d="M6 2h9l5 5v15H6V2z" />
                              <path d="M14 2v6h6" />
                              <path d="M9 13h6M9 17h6" />
                            </svg>
                            <span>All Posts</span>
                            <div className="according-menu">
                              <i className="fa-solid fa-angle-right"></i>
                            </div>
                          </Link>
                        </li> 

                        <li className="sidebar-list">
                          <i className="fa-solid fa-thumbtack"></i>
                          <Link to="/create-post" className={`sidebar-link sidebar-title link-nav ${location.pathname === '/create-post' ? 'active' : ''}`}>
                            {/* <i className={`fa-solid fa-edit ${location.pathname === '/create-post' ? 'iconActive' : ''}`}></i> <span>Create post</span> */} 

                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus h-5 w-5"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                             <span>Create post</span>
                            <div className="according-menu">
                              <i className="fa-solid fa-angle-right"></i>
                            </div>
                          </Link>
                        </li>                       

                        <li className="sidebar-list">
                          <i className="fa-solid fa-thumbtack"></i>
                          <Link to="/post-calendar" className={`sidebar-link sidebar-title link-nav ${location.pathname === '/post-calendar' ? 'active' : ''}`}>
                            {/* <i className={`fas fa-calendar-alt ${location.pathname === '/post-calendar' ? 'iconActive' : ''}`}></i>   */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar h-5 w-5"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
                            <span>Post Calender</span>                            
                            <div className="according-menu">
                              <i className="fa-solid fa-angle-right"></i>
                            </div>
                          </Link>
                        </li> 

                        {/* <li className="sidebar-list">
                          <i className="fa-solid fa-thumbtack"></i>
                          <Link to="/fb-feeds" className={`sidebar-link sidebar-title link-nav ${location.pathname === '/fb-feeds' ? 'active' : ''}`}>
                            <i className={`fa-brands fa-facebook ${location.pathname === '/fb-feeds' ? 'iconActive' : ''}`}></i> <span>FB Feeds</span>                            
                            <div className="according-menu">
                              <i className="fa-solid fa-angle-right"></i>
                            </div>
                          </Link>
                        </li> */}

                        <li className="sidebar-list">
                          <i className="fa-solid fa-thumbtack"></i>
                          <Link to="/analytics" className={`sidebar-link sidebar-title link-nav ${location.pathname === '/analytics' || location.pathname === '/facebook-analytics-detail' || location.pathname === '/linkedin-analytics-detail' ? 'active' : ''}`}>
                            {/* <i className={`fa-solid fa-chart-column ${location.pathname === '/analytics' || location.pathname === '/facebook-analytics-detail' || location.pathname === '/linkedin-analytics-detail' ? 'iconActive' : ''}`}></i> <span>Analytics</span>                             */}

                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-column h-5 w-5"><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg> <span>Analytics</span>  
                            <div className="according-menu">
                              <i className="fa-solid fa-angle-right"></i>
                            </div>
                          </Link>
                        </li> 

                        <li className="sidebar-list">
                          <i className="fa-solid fa-thumbtack"></i>
                          <Link to="/ads-campaign" className={`sidebar-link sidebar-title link-nav ${location.pathname === '/ads-campaign' || location.pathname === '/ads-campaign' || location.pathname === '/ads-campaign' ? 'active' : ''}`}>
                            {/* <i className={`fa-solid fa-bullhorn ${location.pathname === '/ads-campaign' || location.pathname === '/ads-campaign' || location.pathname === '/ads-campaign' ? 'iconActive' : ''}`}></i>  */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-megaphone h-5 w-5"><path d="m3 11 18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>
                            <span>Ads Campaign</span>                            
                            <div className="according-menu">
                              <i className="fa-solid fa-angle-right"></i>
                            </div>
                          </Link>
                        </li>

                        <li className="sidebar-list">
                          <i className="fa-solid fa-thumbtack"></i>
                          <Link to="/inbox" className={`sidebar-link sidebar-title link-nav ${location.pathname === '/inbox' ? 'active' : ''}`}>
                            {/* <i className={`fa-solid fa-inbox  ${location.pathname === '/inbox' ? 'iconActive' : ''}`}></i> <span>Inbox</span> */} 

                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                              fill="none"viewBox="0 0 24 24" stroke="currentColor"
                              strokeWidth="2" strokeLinecap="round"
                              strokeLinejoin="round"className="me-2"
                            >
                              <path d="M4 13h3.439a.991.991 0 0 1 .908.6 3.978 3.978 0 0 0 7.306 0 .99.99 0 0 1 .908-.6H20" />
                              <path d="M4 13v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6" />
                              <path d="M4 13l2-9h12l2 9" />
                            </svg>
                          <span>Inbox</span>
                            <div className="according-menu">
                              <i className="fa-solid fa-angle-right"></i>
                            </div>
                          </Link>
                        </li> 

                        <li className="sidebar-list">
                          <i className="fa-solid fa-thumbtack"></i>
                          <Link to="/settings" className={`sidebar-link sidebar-title link-nav ${location.pathname === '/settings' || location.pathname === '/settings' || location.pathname === '/settings' ? 'active' : ''}`}>
                            {/* <i className={`fa-solid fa-gear ${location.pathname === '/settings' || location.pathname === '/settings' || location.pathname === '/settings' ? 'iconActive' : ''}`}></i>  */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings h-5 w-5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            <span>Settings</span>                            
                            <div className="according-menu">
                              <i className="fa-solid fa-angle-right"></i>
                            </div>
                          </Link>
                        </li> 

                        <li className="sidebar-list">
                          <i className="fa-solid fa-thumbtack"></i>
                          <Link to="/reports" className={`sidebar-link sidebar-title link-nav ${location.pathname === '/reports' || location.pathname === '/reports' || location.pathname === '/reports' ? 'active' : ''}`}>
                            {/* <i className={`fa-solid fa-gear ${location.pathname === '/settings' || location.pathname === '/settings' || location.pathname === '/settings' ? 'iconActive' : ''}`}></i>  */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24"
                              height="24"viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                              strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chart-pie h-5 w-5 "
                            >
                              <path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"></path>
                              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                            </svg>
                            <span>Reports</span>                            
                            <div className="according-menu">
                              <i className="fa-solid fa-angle-right"></i>
                            </div>
                          </Link>
                        </li>    

                      </div>
                      {/* <div className='custom-sidebar-footer'> 
                        <div className="custom-profile btn-group">
                          <button type="button" className="btn profile-btn w-75">
                            <div className='d-flex gap-2 align-items-center text-start'>
                              <div className="profile-circle">SK</div>
                              <div className="profile-info">
                                <span className="name">Sudhir Kundal</span>
                                <span className="role d-flex gap-2 align-items-center"><div className="status-dot"></div>  Pro Member</span>
                              </div>
                            </div>
                          </button>
                          <button type="button" class="btn custom-btn-info dropdown-toggle dropdown-toggle-split w-25" data-bs-toggle="dropdown" aria-expanded="false">
                            <span class="visually-hidden">Toggle Dropdown</span>
                          </button>
                          <ul className="dropdown-menu">
                            <li><Link className="dropdown-item" to="/my-profile">My Profile</Link></li>
                            <li><a className="dropdown-item" href="javascript:void(0);">Settings</a></li>
                            <li><a className="dropdown-item" href="javascript:void(0);" onClick={handleLogout}>Logout </a></li>
                          </ul>
                        </div>
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>            
            </ul>
          </div>
          <div className="right-arrow" id="right-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-right">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </nav>
      </div>
    </div>
  )
}
