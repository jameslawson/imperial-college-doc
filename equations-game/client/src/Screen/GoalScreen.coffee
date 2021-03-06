###*
 * class GoalScreen extends Screen
###
class GoalScreen extends Screen
  
  # {String} The filename of the html file to load the screen.
  file: 'goal.html'

  # {Number[]} An array of dicefaces. The dice used to form goal.
  globalDice: []

  # {EquationBuilder} Used to build equations in the goal screen.
  equationBuilder: undefined

  
  constructor: () ->
  


  ###*
   * Load the Goal Screen. This screen lets the player chosen as goal-setter 
   * select which dice are the goal.
   * @param {Json} json This gives the screen this json: 
   *               {globalDice: Number[] the diceface numbers that can be chosen for the game}
  ###
  init: (json) ->
    @equationBuilder = new EquationBuilder('#added-goal')
    @globalDice = json.globalDice
    # We received the array of dice that we will use to form the goal.
    # This method takes in the array of dice numbers to displays them in the dom. 
    $("#notadded-goal").html(DiceFace.listToHtml(@globalDice, true))
    timeToDoGoal = json.timerDuration - 2
    thisReference = this
    resourceList = $('#notadded-goal li.dice')
    resourceList.bind 'click', (event) ->
      thisReference.addDiceToGoal($(this).data('index'));
    $('#sendgoal').bind 'click', (event) ->
      network.sendGoal(thisReference.createGoalArray())

    currentCounter = 0
    clearInterval toDoGoalTimer
    toDoGoalTimer = setInterval -> 
      currentCounter++
      if(currentCounter >= timeToDoGoal)
        clearInterval(toDoGoalTimer)
      left = timeToDoGoal - currentCounter
      if left == 15 then $('#secondstomakegoal').parent().addClass('glow')
      s = if left == 1 then '' else 's'
      $('#secondstomakegoal').html("#{left} second#{s}")
    , 1000
    

  onKeyup: (e) ->
    switch e.which
      when 80 then network.pauseTurnTimer() # P key
      when 82 then network.resumeTurnTimer() # R key
  
  ###*
   * Return the goal array from the dice in the added-to-goal area
   * @return {Integer} Each element is an index to the original global dice array
  ###
  createGoalArray: () ->
    return @equationBuilder.getIndicesToGlobalDice()



  ###*
   * In the DOM, move a dice from global dice to the goal.
   * Add the diceface to the dom and add a click listener that removes it when its clicked 
   * @param {Number} index The (zero based) index of the global array to move.
  ###
  addDiceToGoal: (index) ->
    # Remove any errors caused by a previous submit
    @removeErrors()
    # There is a maximum of six dice allowed
    # Only allow dice to be added when we are not in the middle of adding brackets
    if(@equationBuilder.getNumberOfDice() < 6 && @equationBuilder.hasCompletedBrackets()) 
      thisReference = this

      diceFace = DiceFace.faceToHtml(@globalDice[index])
      html = "<li class='dice' data-index='" + index + "'><span>#{diceFace}<span></li>"
      
      # Remove the dice from the top
      $('#notadded-goal li.dice[data-index='+index+']').hide 300, ->
        $(this).remove()
      # Add it to the bottom
      $(thisReference.equationBuilder.addDiceToEnd(html)).bind 'click', (event) ->
        thisReference.removeDiceFromGoal($(this).data('index'));


  ###*
   * Remove a dice from the goal and put it back to global dice (append it to the end). 
   * Remove the diceface to the dom and add a click listener that adds it when its clicked
   * @param  {Number} index The (zero based) index in the adding to goal list of dice to remove
  ###
  removeDiceFromGoal: (index) ->
    # Remove any errors caused by a previous submit
    @removeErrors()
    # Try to remove the die from the equation builder container.
    removedElement = @equationBuilder.removeDiceByIndex(index)
    if(removedElement isnt false)
      # Add the dice back to the top
      thisReference = this   
      $(removedElement).hide().appendTo("#notadded-goal").show(300).bind 'click', (event) ->
        thisReference.addDiceToGoal($(this).data('index'));

  ###*
   * onServerError
   * @param  {Json} errorObject A error json with position of error in params
  ###
  onServerError: (errorObject) ->
    # Did the server say an error was caused by parsing?
    switch errorObject.code
      when ErrorManager.codes.parseError, ErrorManager.codes.parserTooManyDigits, ErrorManager.codes.parserMultBrackWithoutTimes, ErrorManager.codes.parserUnbalancedBrack, ErrorManager.codes.parserSqrtNeg, ErrorManager.codes.parserDivByZero, ErrorManager.codes.goalEmpty, ErrorManager.codes.goalTooLarge, ErrorManager.codes.goalNotParse
        # Remove any errors caused by a previous submit
        @removeErrors()
        # Add errors relating the submit we just did
        @hasParseErrors = true
        $("#goalerror").slideDown("fast")
        $("#goalerror").html("Sorry, I don't understand your goal. #{errorObject.msg}")
        $($("#added-goal li:not([data-bracket='none'])")[errorObject.params.token]).addClass('error')

  ###*
   * Remove the error message and any error highlighting.
  ###
  removeErrors: () ->
    if @hasParseErrors
      $("#goalerror").slideUp('fast')
      $("#added-goal li").removeClass('error')
      @hasParseErrors = false



