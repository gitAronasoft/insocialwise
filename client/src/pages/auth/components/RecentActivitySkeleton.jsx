import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function RecentActivitySkeleton({recentActivitiesLoading, activityType, activitySubType, title, activityByUserName, platform, DateTimes, typeAction, activityData}) {
    const reference_pageID = activityData && typeof activityData === "string" 
    ? JSON.parse(activityData) 
    : activityData || {};


    const renderTitle = () => {
        if( activityType === "social" &&activitySubType === "account" && typeAction === "remove") {
            return <span>{title}, social account removed by {activityByUserName}</span>;
        }
        
        if(activityType === "social" && activitySubType === "account" && typeAction === "connected") {
            return <span>{title}, social account connected by {activityByUserName}</span>;
        }

        if(activityType === "social" && activitySubType === "account" && typeAction === "disconnect") {
            return <span>{title}, social account disconnect by {activityByUserName}</span>;
        }

        if(activityType === "social" && activitySubType === "page" && typeAction === "connect") {
            return <span>{title}, page connect by {activityByUserName}</span>;
        }

        if(activityType === "social" && activitySubType === "page" && typeAction === "disconnect") {
            return <span>{title}, page disconnect by {activityByUserName}</span>;
        }

        if(activityType === "posts" && activitySubType === "Draft" && typeAction === "create") {
            return <span>New draft post created on {title} by {activityByUserName}</span>;
        }

        if(activityType === "posts" && activitySubType === "Scheduled" && typeAction === "create") {
            return <span>Post scheduled on {title} by {activityByUserName}</span>;
        }

        if(activityType === "posts" && activitySubType === "published" && typeAction === "create" && reference_pageID?.old_status) {
            return <span>Post created from {reference_pageID?.old_status === "0" ? "Draft" : "Schedule"} on {title} by {activityByUserName}</span>;
        }

        if(activityType === "posts" && activitySubType === "published" && typeAction === "create" && reference_pageID?.published ? "scheduled":"") {
            return <span>A Scheduled post is just published on {title} by {activityByUserName}</span>;
        }

        if(activityType === "posts" && activitySubType === "published" && typeAction === "create") {
            return <span>Published post created on {title} by {activityByUserName}</span>;
        }

        if(activityType === "posts" && activitySubType === "Draft" && typeAction === "update" && reference_pageID?.old_status) {
            return <span>Post updated from "Schedule" to "Draft" on {title} by {activityByUserName}</span>;
        }

        if(activityType === "posts" && activitySubType === "Draft" && typeAction === "update") {
            return <span>Draft post updated on {title} by {activityByUserName}</span>;
        }

        if(activityType === "posts" && activitySubType === "Scheduled" && typeAction === "update" && reference_pageID?.old_status) {
            return <span>Post updated from "Draft" to "Schedule" on {title} by {activityByUserName}</span>;
        }

        if(activityType === "posts" && activitySubType === "Scheduled" && typeAction === "update") {
            return <span>Scheduled post updated on {title} by {activityByUserName}</span>;
        }

        if(activityType === "posts" && activitySubType === "published" && typeAction === "update") {
            return <span>Published post updated on {title} by {activityByUserName}</span>;
        }

        if(activityType === "posts" && activitySubType === "Draft" && typeAction === "delete") {
            return <span>A draft post deleted from {title} by {activityByUserName}</span>;
        }

        if(activityType === "posts" && activitySubType === "Scheduled" && typeAction === "delete") {
            return <span>A scheduled post deleted from {title} by {activityByUserName}</span>;
        }

        if(activityType === "posts" && activitySubType === "published" && typeAction === "delete") {
            return <span>A published post deleted from {title} by {activityByUserName}</span>;
        }

        if(activityType === "ads" && activitySubType === "campaign" && typeAction === "create") {
            return <span>{title}, campaign created by {activityByUserName}</span>;
        }

        if(activityType === "ads" && activitySubType === "account" && typeAction === "connect") {
            return <span>{title}, ads account connected by {activityByUserName}</span>;
        }

        return <span>{title}</span>;
    };

    const renderDot = () => {
        if( activityType === "social" &&activitySubType === "account" && typeAction === "remove") {
            return <div className="red-dot" style={{backgroundColor:'red',width:'8px',height:'8px',marginTop:'8px',borderRadius:'50px'}}></div>;
        }
        
        if(activityType === "social" && activitySubType === "account" && typeAction === "connected") {
            return <div className="green-dot"></div>;
        }

        if(activityType === "social" && activitySubType === "account" && typeAction === "disconnect") {
            return <div className="red-dot" style={{backgroundColor:'red',width:'8px',height:'8px',marginTop:'8px',borderRadius:'50px'}}></div>;
        }

        if(activityType === "social" && activitySubType === "page" && typeAction === "connect") {
            return <div className="green-dot"></div>;
        }

        if(activityType === "social" && activitySubType === "page" && typeAction === "disconnect") {
            return <div className="red-dot" style={{backgroundColor:'red',width:'8px',height:'8px',marginTop:'8px',borderRadius:'50px'}}></div>;
        }

        if(activityType === "posts" && activitySubType === "Draft" && typeAction === "create") {
            return <div className="draft-dot"></div>;
        }

        if(activityType === "posts" && activitySubType === "published" && typeAction === "create") {
            return <div className="green-dot"></div>;
        }

        if(activityType === "posts" && activitySubType === "Scheduled" && typeAction === "create") {
            return <div className="scheduled-dot"></div>;
        }

        if(activityType === "posts" && activitySubType === "Draft" && typeAction === "update") {
            return <div className="draft-dot"></div>;
        }

        if(activityType === "posts" && activitySubType === "published" && typeAction === "update") {
            return <div className="green-dot"></div>;
        }

        if(activityType === "posts" && activitySubType === "Scheduled" && typeAction === "update") {
            return <div className="scheduled-dot"></div>;
        }

        if(activityType === "posts" && typeAction === "delete") {
            return <div className="red-dot" style={{backgroundColor:'red',width:'8px',height:'8px',marginTop:'8px',borderRadius:'50px'}}></div>;
        }

        if(activityType === "ads" && activitySubType === "campaign" && typeAction === "create") {
            return <div className="green-dot"></div>;
        }

        if(activityType === "ads" && activitySubType === "campaign" && typeAction === "create") {
            return <div className="green-dot"></div>;
        }

        if(activityType === "ads" && activitySubType === "account" && typeAction === "connect") {
            return <div className="green-dot"></div>;
        }

        return <span>{title}</span>;
    };

    const renderPlatformIcon = () => {
        if(platform==="facebook") {
            return <div className={`${platform}-profile-img`} 
                style={{width:'25px',height:'25px'}}>                
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-facebook h-6 w-6 text-white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>                
            </div>;
        }
        
        if(platform==="linkedin") {
            return <div className={`${platform}-profile-img`} style={{width:'25px',height:'25px'}}>                
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-linkedin h-6 w-6 text-white"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>                
            </div>;
        }
        if(platform==="instagram") {
            return <div className={`${platform}-profile-img`} style={{width:'25px',height:'25px'}}>                
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="white" stroke="none" className="h-6 w-6" ><path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2c1.6 0 3 1.4 3 3v10c0 1.6-1.4 3-3 3H7c-1.6 0-3-1.4-3-3V7c0-1.6 1.4-3 3-3h10zm-5 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zm0 2a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm4.8-.9a1.1 1.1 0 11-2.2 0 1.1 1.1 0 012.2 0z"/></svg>
            </div>;
        }
        return <span>{title}</span>;
    };

    const renderButton = () => {
        if( activityType === "social" &&activitySubType === "account" && typeAction === "remove") {
            return <div className='published' style={{borderRadius:'50px',fontSize:'12px',fontWeight:'600',backgroundColor:'#ff572263',color:'#FF5722',padding:'2px 12px'}}> {typeAction} </div>;
        }
        
        if(activityType === "social" && activitySubType === "account" && typeAction === "connected") {
            return <div className='published'> {typeAction} </div>;
        }

        if(activityType === "social" && activitySubType === "account" && typeAction === "disconnect") {
            return <div className='published' style={{borderRadius:'50px',fontSize:'12px',fontWeight:'600',backgroundColor:'#ff572263',color:'#FF5722',padding:'2px 12px'}}> {typeAction} </div>;
        }

        if(activityType === "social" && activitySubType === "page" && typeAction === "connect") {
            return <div className='published'> {typeAction} </div>;
        }

        if(activityType === "social" && activitySubType === "page" && typeAction === "disconnect") {
            return <div className='published' style={{borderRadius:'50px',fontSize:'12px',fontWeight:'600',backgroundColor:'#ff572263',color:'#FF5722',padding:'2px 12px'}}> {typeAction} </div>;
        }

        if(activityType === "posts" && activitySubType === "Draft" && typeAction === "create") {
            return <div className='draft'> {activitySubType} </div>;
        }

        if(activityType === "posts" && activitySubType === "published" && typeAction === "create") {
            return <div className='published'> {activitySubType} </div>;
        }

        if(activityType === "posts" && activitySubType === "Scheduled" && typeAction === "create") {
            return <div className='scheduled'> scheduled </div>;
        }

        if(activityType === "posts" && activitySubType === "Draft" && typeAction === "update") {
            return <div className='draft'> Update </div>;
        }

        if(activityType === "posts" && activitySubType === "Scheduled" && typeAction === "update") {
            return <div className='scheduled'> Update </div>;
        }

        if(activityType === "posts" && activitySubType === "published" && typeAction === "update") {
            return <div className='published'> Update </div>;
        }

        if(activityType === "posts" && typeAction === "delete") {
            return <div className='scheduled' style={{borderRadius:'50px',fontSize:'12px',fontWeight:'600',backgroundColor:'#ff572263',color:'#FF5722',padding:'2px 12px'}}> Delete </div>;
        }

        if(activityType === "ads" && activitySubType === "campaign" && typeAction === "create") {
            return <div className='published'> {typeAction} </div>;
        }       

        if(activityType === "ads" && activitySubType === "account" && typeAction === "connect") {
            return <div className='published'> {typeAction} </div>;
        }

        return <span>{title}</span>;
    };

    return (
        <>
            {recentActivitiesLoading ? (
                <div className='d-flex recent-activity-card gap-2 addPlatform-card'>                    
                    <div> 
                        <span> <Skeleton width={280} height={20} baseColor="#e0e0e0" highlightColor="#f5f6f7" /></span>
                        <div className='d-flex align-items-center justify-content-between my-1'>  
                            <div className='d-flex align-items-center gap-2'> 
                                <div> 
                                    <p> 
                                        <Skeleton width={80} height={15} baseColor="#e0e0e0" highlightColor="#f5f6f7" /> 
                                    </p>   
                                </div>
                                <div> 
                                    <p> 
                                        <Skeleton width={80} height={15} baseColor="#e0e0e0" highlightColor="#f5f6f7" /> 
                                    </p> 
                                </div>
                            </div>                            
                            <Skeleton width={80} height={15} baseColor="#e0e0e0" highlightColor="#f5f6f7" />                            
                        </div>                        
                    </div>
                </div>
            ) : (
                <div className='d-flex recent-activity-card gap-2 addPlatform-card'>
                    {renderDot()}
                    <div style={{width: "100%"}}> 
                        {renderTitle()}
                        <div className='d-flex align-items-center justify-content-between my-1'>  
                            <div className='d-flex align-items-center gap-2'> 
                                <div> <p> {renderPlatformIcon()} </p>   </div>
                                <div> <p> • {DateTimes} </p> </div>
                            </div> 
                            {renderButton()}
                        </div>                        
                    </div>
                </div>
            )}
        </>
    )
}
