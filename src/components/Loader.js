import React from "react";
import './Loader.scss'

const loader = ({text='处理中'}) => (
    <div className="loading-component text-center">
        <div class="spinner-grow text-primary" role="status">
            <span class="visually-hidden">{text}</span>
        </div>
        <h5 className="text-primary">{text}</h5>
    </div>
)

export default loader