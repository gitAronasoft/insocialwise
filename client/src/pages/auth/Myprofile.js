import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';


const Profile = () => {
    return (
        <div className="page-wrapper compact-wrapper" >
            <Header />
            <div className="page-body-wrapper">
                <Sidebar />
                <div className="page-body">
                    <div className="container-fluid">
                        <div className="page-title">
                            <div className="row">
                                <div className="col-sm-6">
                                    <h3>My Profile</h3>
                                </div>
                                <div className="col-sm-6">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item">Dashboard</li>
                                        <li className="breadcrumb-item active">My Profile</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-12 col-sm-12 col-md-12">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                                            <div>
                                                <h5 className="mb-2">Account Managment</h5>
                                            </div>
                                            <div>
                                                {/* <button className='btn btn-primary '> Edit Profile </button> */}
                                            </div>
                                        </div>

                                        <div className='row'>
                                            {/* <div className='col-md-4'>
                                                <div className="left-panel">
                                                    <div className="profile-pic">
                                                        <img src="https://i.ibb.co/sqf6cMp/user.jpg" alt="Profile Picture" />
                                                        <button className="remove-btn">×</button>
                                                    </div>
                                                    <button className="upload-btn">Upload Photo</button>

                                                    <div className="password-section">
                                                        <input type="password" className='form-control' placeholder="Old Password" />
                                                        <input type="password" className='form-control' placeholder="New Password" />
                                                        <button className="change-pass-btn">Change Password</button>
                                                    </div>
                                                </div>
                                            </div> */}

                                            <div className='col-md-3'>
                                                <div className="left-panel">
                                                    <div className="profile-pic">
                                                        <img src="https://i.ibb.co/sqf6cMp/user.jpg" alt="Profile Picture" />
                                                        <button className="remove-btn">×</button>
                                                    </div>
                                                   {/* <button className="change-pass-btn btn btn-primary">Change Password</button> */}
                                                    <button className="upload-btn">Upload Photo</button>
                                                   {/* <div className='d-flex align-items-center justify-content-center gap-4'> 
                                                    <div> <a class="btn btn-primary btn-sm" href="#!"><i class="fa-solid fa-pencil"></i> Edit</a></div>
                                                    <div><a class="btn btn-danger btn-sm" href="#!"><i class="fa-solid fa-trash"></i> Delete</a> </div>
                                                   </div> */}
                                                </div>
                                            </div>
                                            <div className='col-md-9'>
                                                <div class="right-panel">
                                                    <div class="form-grid">
                                                        <div class="form-group">
                                                            <label>First Name</label>
                                                            <input className='form-control' type="text" placeholder="Frist Name "  />
                                                        </div>
                                                        <div class="form-group">
                                                            <label>Last name</label>
                                                            <input className='form-control' type="text" placeholder="Last Name"/>
                                                        </div>
                                                        <div class="form-group">
                                                            <label> Email </label>
                                                            <input className='form-control' type="text" placeholder="Your Email" />
                                                        </div>
                                                        <div class="form-group">
                                                            <label>Role</label>
                                                            <input className='form-control' type="text" placeholder="Role" />
                                                        </div>
                                                        <div class="form-group">
                                                            <label>Status </label>
                                                            <input className='form-control' type="text" placeholder="Status" />
                                                        </div>
                                                    </div>
                                                    <div> 
                                                        <h6 className='my-3 pt-2'> Password </h6>
                                                        <div class="form-grid">
                                                            <div class="form-group">
                                                                <label>Old Password</label>
                                                                <input type="password" className='form-control' placeholder="Old Password" />
                                                            </div>
                                                            <div class="form-group">
                                                                <label>New Password </label>
                                                                <input type="password" className='form-control' placeholder="New Password" />
                                                            </div>
                                                            {/* <input type="password" className='form-control' placeholder="Old Password" /> */}
                                                            {/* <input type="password" className='form-control' placeholder="New Password" /> */}
                                                        
                                                        
                                                        </div> 
                                                     <button className="btn btn-primary my-3">Change Password</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    )
};

export default Profile;

