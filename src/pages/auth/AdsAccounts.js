import React, { useState,useEffect,useRef } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import axios from "axios";

export default function AdsAccounts() {

    const responseFacebook = (response) => {               
        const { accessToken } = response;      
        if(accessToken){  
            fetchUserData(accessToken); 
        } else {              
            console.error('Failed to retrieve access token.');
        }
    };

    const fetchUserData = async (accessToken) => {
    try {
        const userResponse = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?access_token=${accessToken}`);
        const adAccounts = await userResponse.json();

        if (!adAccounts.data || adAccounts.data.length === 0) {
            console.log('No ad accounts returned — likely because user only granted access to some businesses');
            return;
        }

        console.log('adAccounts',adAccounts);

        // // Now get details of those selected ad accounts
        // const detailPromises = adAccounts.data.map(account => {
        //     return axios.get(`https://graph.facebook.com/v19.0/${account.id}`, {
        //         params: {
        //             access_token: accessToken,
        //             fields: 'id,account_id,name,account_status,currency,timezone_name,spend_cap,amount_spent,created_time'
        //         }
        //     }).then(res => res.data);
        // });

        // const fullDetails = await Promise.all(detailPromises);
        // console.log('Full details of selected ad accounts:', fullDetails);
    } catch (error) {
        console.error('Error fetching ad account details:');
    }
};



    return (
        <div className="page-wrapper compact-wrapper" >
            <Header/>
            <div className="page-body-wrapper">        
                <Sidebar/>
                <div className="page-body">
                    <div className="container-fluid">
                        <div className="page-title">
                            <div className="row">
                                <div className="col-sm-6">
                                    <h3>Ads Accounts</h3>
                                </div>
                                <div className="col-sm-6">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item">Dashboard</li>
                                        <li className="breadcrumb-item active">Ads Accounts</li>
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
                                                <h5 className="mb-2"> Ads accounts </h5>
                                                <p className="my-2"> These are the social ads accounts.</p>
                                            </div>
                                            <div>
                                                <p>
                                                    <button className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center">
                                                        <i className="fa-brands fa-facebook me-2"></i>
                                                        <FacebookLogin
                                                            appId={process.env.REACT_APP_FACEBOOK_APP_ID}
                                                            autoLoad={false}
                                                            fields="name,email,picture,accounts"
                                                            scope="ads_management,ads_read,business_management,pages_show_list,pages_manage_metadata,pages_read_engagement,pages_read_user_content,pages_manage_posts,pages_manage_engagement,read_insights"
                                                            callback={responseFacebook}                                                            
                                                            render={renderProps => (
                                                                <span onClick={renderProps.onClick} style={{cursor:'pointer'}} >Facebook</span>
                                                            )}                                                                     
                                                        />
                                                    </button>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>    
    )
}
