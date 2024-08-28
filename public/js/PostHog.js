!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init(`phc_o6Irh4IJIejYBaZCnS115xMx05UMMLekRsQjZSbJ4O8`,{api_host:`https://eu.posthog.com`})


//* FORM TRACKING EVENTS

export const postHogFormImpression = (formName) => {
    posthog.capture(`formStepImpression`, 
    { formName: `${formName}` }
    )
};

export const postHogFormSubmit = (formName) => {
    posthog.capture(`formSubmit`,
        { formName: `${formName}` }
    )
};

//* FORM FIELD TRACKING EVENTS

export const postHogFormStepImpression = (formName, formStep) => {
    posthog.capture(`formStepImpression`, 
    { formName: `${formName}`,
        formStep: `${formStep}` || `formStep not defined`}
    )
};

export const postHogFormFieldInteraction = (formName, fieldName) => {
    posthog.capture(`formFieldInteraction`, 
    { formName: `${formName}`,
    fieldName: `${fieldName}` }
    )
};

export const postHogFormStepSubmit = (formName, formStep) => {
    posthog.capture(`formSubmit`,
        { formName: `${formName}`,
            formStep: `${formStep}` || `formStep not defined`
        }
    )
};

//* UI ELEMENT TRACKING EVENTS

export const posthogUiElementInteraction = (elementInnerText, elementGroup) => {
    posthog.capture(`uiElementInteraction`, 
    { elementName: `${elementInnerText}`,
        elementGroup: `${elementGroup}`
    }
    )
};