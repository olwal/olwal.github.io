// JavaScript Document

	function setVisibility(id, visibility) 
	{
		document.getElementById(id).style.display = visibility;
	}
/*
	conflicts with ballontip.js

	function showhide(id)
	{
		if (document.getElementById)
		{
			obj = document.getElementById(id);
		
			if (obj.style.display == "none")
			{
				obj.style.display = "";
			} 
			else 
			{
				obj.style.display = "none";
			}
		}
	}
*/
  function showText(textID) { 
    var textText = document.getElementById(textID); 
	var textArrow = document.getElementById(textID + "_arrow");
      textText.style.display = 'none';  
      textArrow.src = "images/right.gif";
  } 
  function blockText(textID) { 
    var textText = document.getElementById(textID); 
	var textArrow = document.getElementById(textID + "_arrow");
      textText.style.display = 'block';  
      textArrow.src = "images/down.gif";
  } 
  function changeText(textID) 
  {   
	var textText = document.getElementById(textID); 
	
	if (textText.style.display == 'block') 
	{
      textText.style.display = 'none';  
	} 
	else 
	{
      textText.style.display = 'block';  
	}
  } 
  function changeTextAndArrow(textID) 
  { 
    var textText = document.getElementById(textID); 
	var textArrow = document.getElementById(textID + "_arrow");
	
	if (textText.style.display == 'block') 
	{
      textText.style.display = 'none';  
	  textArrow.src = "images/right.gif";
	} 
	else 
	{
      textText.style.display = 'block';  
	  textArrow.src = "images/down.gif";
	}
  }

  function flipText(textID) 
  {   
	var textText = document.getElementById(textID); 
	
	if (textText.style.display == 'inline') 
	{
      textText.style.display = 'none';  
	} 
	else 
	{
      textText.style.display = 'block';  
	}
  } 



