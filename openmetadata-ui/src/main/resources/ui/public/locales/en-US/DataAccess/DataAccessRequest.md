# Data Access Request

In this section, you will find guidance on submitting a data access request to gain permissions for specific data assets.

## Overview

The Data Access Request form allows you to request access to glossary terms and data assets within the OpenMetadata platform. All requests are tracked and must be approved before access is granted.

## Form Fields

$$section
### Data Asset $(id="dataAsset")

Select the glossary term or data asset you want to access. You can search for available glossary terms using the search functionality.

**Requirements:**
- You must select exactly one data asset
- The data asset must be an existing glossary term in the system
- You can change your selection before submitting

**Example:**
If you need access to customer data, search for and select the relevant glossary term like "Customer PII" or "Customer Demographics".
$$

$$section
### Purpose $(id="purpose")

Describe why you need access to this data asset. This helps approvers understand your use case.

**Requirements:**
- Minimum 10 characters
- Maximum 500 characters
- Must clearly explain your intended use of the data

**Example:**
"I need access to customer demographic data to perform market segmentation analysis for the Q1 2025 marketing campaign. The analysis will help identify target customer groups and improve campaign effectiveness."
$$

$$section
### Access Duration $(id="accessDuration")

Specify the time period for which you need access to the data asset.

**Requirements:**
- Start date cannot be in the past
- Access duration must be between 1 and 365 days
- End date must be after start date

**Tips:**
- Request only the duration you actually need
- Consider project timelines and deadlines
- Access will automatically expire after the end date

**Example:**
If your project runs from January 15 to March 15, select those dates as your access period (60 days).
$$

$$section
### Priority $(id="priority")

Indicate the urgency level of your access request.

**Options:**
- **None**: No specific priority (for exploratory or non-urgent requests)
- **Low**: Can wait for standard processing time
- **Normal**: Standard business need (default selection)
- **High**: Important for ongoing projects or deliverables
- **Critical**: Urgent business need, blocking critical work

**Guidelines:**
- Default priority is "Normal" for most requests
- Use "High" or "Critical" only for genuinely urgent needs
- Higher priority requests may get faster review but require additional justification

**Example:**
Select "High" if you need the data for a presentation to executive leadership next week.
$$

$$section
### Notes $(id="notes")

Add any additional information that might help the approver process your request (optional).

**Use Notes For:**
- Additional context about your project
- Specific security or compliance considerations
- Timeline constraints or deadlines
- References to related projects or approvals

**Example:**
"This request is part of the Data Governance Initiative approved by the CDO. The analysis results will be shared with the data stewardship committee on February 1st."
$$

## After Submission

Once you submit your request:
1. You will receive a unique Request ID for tracking
2. Approvers will be notified automatically
3. You can view the status of your request in the Access Requests list
4. You will be notified when your request is reviewed

## Best Practices

- **Be Specific**: Clearly explain why you need access and how you'll use the data
- **Request Appropriate Duration**: Don't request more time than you need
- **Set Realistic Priority**: Choose priority levels that match actual business needs
- **Provide Context**: Use the notes field to give reviewers additional helpful information

## Support

If you have questions about the access request process, please contact your data governance team or system administrator.
