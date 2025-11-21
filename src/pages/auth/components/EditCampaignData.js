import React, { useEffect, useState, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import DatePicker from "react-datepicker";
import Select from 'react-select';
import { createFilter } from 'react-select';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { toast } from 'react-toastify';

const EditCampaignData = ({ show, onHide, CampaignData, editStepNumber}) => {
    const [currentStep, setCurrentStep] = useState(1);  

    useEffect(() => {        
        setCurrentStep(editStepNumber);
    }, [editStepNumber]);

    useEffect(() => {
        document.querySelectorAll(".step-indicator").forEach((step) => {
            const stepNum = parseInt(step.getAttribute("data-step"));
            step.classList.toggle("active", stepNum === currentStep);
        });

        // Show correct page and hide others
        document.querySelectorAll(".page").forEach((page, index) => {
            page.classList.toggle("d-none", index + 1 !== currentStep);
        });

        // Update progress line
        const progressFill = document.getElementById("progressLineFill");
        if (progressFill) {
            progressFill.style.height = `${getProgressPercent(currentStep)}%`;
        }
    }, [currentStep]);

    const getProgressPercent = (step) => {
         return 100; // 🌟 Updated to 100 🌟        
    };    

    return (
        <>
            <Modal 
                dialogClassName="custom-modal-width"
                show={show} 
                onHide={onHide} 
                centered 
                backdrop="static" 
                keyboard={false}
            >
                <Modal.Header 
                    closeButton 
                    onHide={onHide}
                >
                    <Modal.Title style={{fontSize:'15px'}}>
                        <h5 className="modal-title" id="createAdModalLabel">
                            Ad Campaign Edit: {CampaignData.campaign_name}
                        </h5>
                    </Modal.Title>                
                </Modal.Header>
                <Modal.Body>
                    <div className="row">
                        <div className="col-2 col-sm-4 col-md-5 col-xl-4 left-sidebar-steps">
                            <div className="progress-container">
                                <div className="progress-steps">
                                    <div className="progress-line"></div>
                                    <div id="progressLineFill" className="progress-line-fill"></div>                                    
                                    {/* Start steps  */}
                                        <div 
                                            className={`step-indicator completed ${currentStep === 1 ? 'active' : ''} `} 
                                            data-step="1"                                          
                                        >
                                            <div className="step-marker">
                                                <div className="step-circle">1</div>
                                                <div className="step-line"></div>
                                            </div>
                                            <div className={`step-content w-100`}>
                                                <div className='d-flex justify-content-between gap-1'> 
                                                    <h6 className='fw-bold'>Set you campaign objective </h6>  
                                                    <i className='fa-regular fa-pen-to-square p-1 fw-bold'></i> 
                                                </div>

                                                <p>Social account</p>
                                                <p>
                                                    <strong> {CampaignData.account_social_userid} </strong>
                                                </p>

                                                <p>Page</p>
                                                <p>
                                                    <strong> Null </strong>
                                                </p>

                                                <p>Add Account</p>
                                                <p>
                                                    <strong> {CampaignData.ad_account_id} </strong>
                                                </p>

                                                <p>Campaign Name</p>
                                                <p>
                                                    <strong> {CampaignData.campaign_name} </strong>
                                                </p>

                                                <p>Campaign objective</p>
                                                <p>
                                                    <strong> {CampaignData.campaign_objective}</strong>
                                                </p>

                                            </div>
                                        </div>

                                        <div 
                                            className={`step-indicator mt-2 completed ${currentStep === 2 ? 'active' : ''}`} 
                                            data-step="2"
                                        >
                                            <div className="step-marker">
                                                <div className="step-circle">2</div>
                                                <div className="step-line"></div>
                                            </div>
                                            <div className={`step-content w-100`}>
                                                <div className='d-flex justify-content-between gap-1'>
                                                    <h6 className='fw-bold'>Choose your audience and budget </h6>
                                                    <i className='fa-regular fa-pen-to-square p-1 fw-bold'></i>
                                                </div>

                                                <p>Audience</p>
                                                <p><strong> Built audience </strong></p>

                                                <p>Placements</p>
                                                <p>
                                                    <strong> Automatic placements </strong>
                                                </p>

                                                <p className=''>Budget</p>
                                                <p className=''>
                                                    <strong>daily</strong>
                                                </p>

                                                <p>Duration</p>
                                                <p>
                                                    <div> <strong>From -</strong>  </div>
                                                    <div> <strong> To -</strong> </div>
                                                </p>

                                            </div>
                                        </div>

                                        <div 
                                            className={`step-indicator mt-2 completed ${currentStep === 3 ? 'active' : ''}`} 
                                            data-step="3"                                           
                                        >
                                            <div className="step-marker">
                                                <div className="step-circle">3</div>
                                                <div className="step-line"></div>
                                            </div>
                                            <div className="step-content w-100">
                                                <div className='d-flex justify-content-between gap-1'>
                                                    <h6 className='fw-bold'>Created your ads </h6> 
                                                    <i className='fa-regular fa-pen-to-square p-1 fw-bold'></i>
                                                </div>                                            
                                                <p>Draft the content for your ads</p>
                                            </div>
                                        </div>

                                    {/* End steps  */}

                                </div>
                            </div>
                        </div>
                        <div className="col-10 col-sm-8 col-md-7 col-xl-8  custom-y-scroll">
                            {/* Start step one */}
                            <div className="page" id="page1">
                                <div className="step-one">
                                    <div className="my-2">
                                        <h5 className='fw-bold'> Set your campaign objective </h5>
                                        <p className="custom_p"> 
                                            Choose who you want to see your ad on Facebook, then set your budget and when you want your campaign to run.
                                        </p>
                                    </div>
                                    <div className="mb-2">
                                        <label for="campaignName" className="form-label">Social account</label>
                                        <p className="d-block mb-2">
                                            Choose the Facebook socail account you want to use for pages and ad account.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* End step one */}

                            {/* Start step two */}
                                <div className="page d-none" id="page2">
                                    <div className="step-two">
                                        <div className="mb-2">
                                            <h5 className='fw-bold'>Decide on your audience and budget</h5>
                                            <p className=" d-block mb-2 custom_p">
                                                Your audience is the group of people who will potentially see your ad. Use our default audience settings or an audience you created on Facebook.
                                            </p>
                                        </div>
                                        <div className="mb-2">
                                            <label for="campaignName" className="form-label">Audience</label>
                                            <p className="d-block mb-2">
                                                Your audience is the group of people who will potentially see your ad. Use our default audience settings or an audience you created on Facebook.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            {/* End step two */}

                            {/* Start step three */}
                                <div className="page d-none" id="page3">
                                    <div className="step-three">
                                        <div className="mb-2">
                                            <h6>Three Step</h6>                                    
                                        </div>
                                    </div>
                                </div>
                            {/* End step three */}

                        </div>
                    </div>
                </Modal.Body>
                <div className="modal-footer justify-content-end">                                
                    <div className="d-flex my-lg-3 custom-width-100 text-end">                   
                        <button 
                            className="btn btn-outline-secondary me-2"
                        >
                            Update
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    )
};

export default EditCampaignData;